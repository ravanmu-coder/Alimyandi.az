"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import * as signalR from "@microsoft/signalr"
import { toast } from "react-hot-toast"
import { useAuctionStore } from "../stores/auctionStore"

/**
 * useBidHub
 *
 * BidHub SignalR connection-u idarə edir
 * Backend URL: /bidHub
 *
 * Funksiyalar:
 * - JoinAuctionCarGroup(auctionCarId)
 * - LeaveAuctionCarGroup(auctionCarId)
 * - PlaceLiveBid(auctionCarId, amount)
 */

interface UseBidHubProps {
  baseUrl: string
  token: string
  auctionCarId: string | null
  onNewLiveBid?: (data: any) => void
  onHighestBidUpdated?: (data: any) => void
  onBidStatsUpdated?: (data: any) => void
}

interface UseBidHubReturn {
  isConnected: boolean
  connectionState: string
  placeLiveBid: (auctionCarId: string, amount: number) => Promise<void>
  joinCarGroup: (carId: string) => Promise<void>
  leaveCarGroup: (carId: string) => Promise<void>
}

export const useBidHub = ({
  baseUrl,
  token,
  auctionCarId,
  onNewLiveBid,
  onHighestBidUpdated,
  onBidStatsUpdated,
}: UseBidHubProps): UseBidHubReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<string>("Disconnected")
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const currentCarIdRef = useRef<string | null>(null)

  // Store actions
  const updateHighestBid = useAuctionStore((state) => state.updateHighestBid)
  const addBidToHistory = useAuctionStore((state) => state.addBidToHistory)
  const updateStats = useAuctionStore((state) => state.updateStats)

  // ========================================
  // CONNECTION SETUP
  // ========================================

  useEffect(() => {
    const BID_HUB_URL = `${baseUrl}/bidHub`

    console.log("🔌 [BidHub] Initializing connection to:", BID_HUB_URL)

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(BID_HUB_URL, {
        accessTokenFactory: () => token || "",
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
        skipNegotiation: false,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 10000)
          }
          return null
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build()

    connectionRef.current = connection

    // ========================================
    // EVENT HANDLERS (Case-Sensitive!)
    // ========================================

    connection.on("NewLiveBid", (data: any) => {
      console.log("💰 [BidHub] NewLiveBid received:", {
        id: data.id,
        amount: data.amount,
        userId: data.userId,
        userName: data.userName,
        carId: data.auctionCarId,
        timestamp: data.timestamp,
      })

      // Validate required fields
      if (!data.amount || !data.auctionCarId) {
        console.error("❌ [BidHub] Invalid bid data received:", data)
        return
      }

      const bidData = {
        id: data.id || `bid-${Date.now()}-${Math.random()}`,
        auctionCarId: data.auctionCarId,
        userId: data.userId || "unknown",
        amount: Number(data.amount), // Ensure it's a number
        bidType: data.bidType || "Live",
        timestamp: data.timestamp || new Date().toISOString(),
        isWinning: data.isWinning ?? true,
        isOutbid: data.isOutbid ?? false,
        user: {
          id: data.userId || "unknown",
          email: data.userEmail || "",
          firstName: data.userName || data.user?.firstName || "Anonymous",
          lastName: data.user?.lastName || "",
        },
      }

      console.log("📝 [BidHub] Updating store with bid:", bidData)
      updateHighestBid(bidData)
      addBidToHistory(bidData)

      // Call callback if provided
      onNewLiveBid?.(data)

      const toastId = `bid-${data.auctionCarId}-${data.amount}`
      toast(`${bidData.user.firstName} bid $${bidData.amount.toLocaleString()}`, {
        id: toastId,
        icon: "🔨",
        duration: 3000,
      })
    })

    connection.on("HighestBidUpdated", (data: any) => {
      console.log("🏆 [BidHub] HighestBidUpdated received:", {
        amount: data.amount,
        userId: data.userId,
        userName: data.userName,
        carId: data.auctionCarId,
      })

      // Update store if valid data
      if (data.amount && data.auctionCarId) {
        const bidData = {
          id: data.id || `bid-${Date.now()}-${Math.random()}`,
          auctionCarId: data.auctionCarId,
          userId: data.userId || "unknown",
          amount: Number(data.amount),
          bidType: "Live",
          timestamp: data.timestamp || new Date().toISOString(),
          isWinning: true,
          isOutbid: false,
          user: {
            id: data.userId || "unknown",
            email: data.userEmail || "",
            firstName: data.userName || "Winner",
            lastName: "",
          },
        }

        console.log("📝 [BidHub] Updating highest bid in store:", bidData)
        updateHighestBid(bidData)
      }

      onHighestBidUpdated?.(data)
    })

    connection.on("BidStatsUpdated", (data: any) => {
      console.log("📊 [BidHub] BidStatsUpdated received:", data)

      updateStats({
        totalBids: data.totalBids || 0,
        uniqueBidders: data.uniqueBidders || 0,
        activeBidders: data.activeBidders || 0,
      })

      onBidStatsUpdated?.(data)
    })

    // ========================================
    // CONNECTION LIFECYCLE
    // ========================================

    connection.onclose((error) => {
      console.log("❌ [BidHub] Connection closed:", error?.message)
      setIsConnected(false)
      setConnectionState("Disconnected")
      toast.error("Disconnected from bid service... reconnecting", {
        id: "bidhub-status",
        duration: 3000,
      })
    })

    connection.onreconnecting((error) => {
      console.log("🔄 [BidHub] Reconnecting...", error?.message)
      setConnectionState("Reconnecting")
      toast.loading("Reconnecting to bid service...", {
        id: "bidhub-reconnect",
        duration: Number.POSITIVE_INFINITY,
      })
    })

    connection.onreconnected((connectionId) => {
      console.log("✅ [BidHub] Reconnected:", connectionId)
      setIsConnected(true)
      setConnectionState("Connected")
      toast.success("Reconnected to bid service!", {
        id: "bidhub-reconnect",
        duration: 3000,
      })

      if (currentCarIdRef.current) {
        connection
          .invoke("JoinAuctionCarGroup", currentCarIdRef.current)
          .then(() => {
            console.log("✅ [BidHub] Rejoined car group:", currentCarIdRef.current)
            toast("Connected to live auction", {
              id: "bidhub-joined",
              icon: "✅",
              duration: 2000,
            })
          })
          .catch((err) => {
            console.error("❌ [BidHub] Failed to rejoin car group:", err)
          })
      }
    })

    // ========================================
    // START CONNECTION
    // ========================================

    const startConnection = async () => {
      try {
        setConnectionState("Connecting")
        await connection.start()
        console.log("✅ [BidHub] Connected successfully")
        setIsConnected(true)
        setConnectionState("Connected")
      } catch (err) {
        console.error("❌ [BidHub] Connection failed:", err)
        setConnectionState("Failed")
        toast.error("Failed to connect to bid service", { id: "bidhub-error" })
      }
    }

    startConnection()

    // Cleanup
    return () => {
      console.log("🧹 [BidHub] Cleaning up...")
      if (currentCarIdRef.current) {
        connection.invoke("LeaveAuctionCarGroup", currentCarIdRef.current).catch((err) => {
          console.warn("⚠️ Failed to leave car group:", err)
        })
      }
      connection.stop().catch((err) => {
        console.warn("⚠️ Failed to stop connection:", err)
      })
    }
  }, [
    baseUrl,
    token,
    updateHighestBid,
    addBidToHistory,
    updateStats,
    onNewLiveBid,
    onHighestBidUpdated,
    onBidStatsUpdated,
  ])

  // ========================================
  // JOIN/LEAVE CAR GROUP
  // ========================================

  useEffect(() => {
    const connection = connectionRef.current
    if (!connection || !isConnected || !auctionCarId) return

    const joinCarGroup = async () => {
      try {
        // Leave previous group if exists
        if (currentCarIdRef.current && currentCarIdRef.current !== auctionCarId) {
          await connection.invoke("LeaveAuctionCarGroup", currentCarIdRef.current)
          console.log("👋 [BidHub] Left car group:", currentCarIdRef.current)
        }

        // Join new group
        await connection.invoke("JoinAuctionCarGroup", auctionCarId)
        currentCarIdRef.current = auctionCarId
        console.log("✅ [BidHub] Joined car group:", auctionCarId)
      } catch (err) {
        console.error("❌ [BidHub] Failed to join car group:", err)
        toast.error("Failed to join car auction")
      }
    }

    joinCarGroup()
  }, [auctionCarId, isConnected])

  // ========================================
  // METHODS
  // ========================================

  const placeLiveBid = useCallback(
    async (carId: string, amount: number): Promise<void> => {
      const connection = connectionRef.current
      if (!connection || !isConnected) {
        throw new Error("Not connected to bid service")
    }

    try {
        console.log("🎯 [BidHub] Placing bid:", { carId, amount })

        // Call server method: PlaceLiveBid(auctionCarId, amount)
        await connection.invoke("PlaceLiveBid", carId, amount)

        console.log("✅ [BidHub] Bid placed successfully")
      } catch (err: any) {
        console.error("❌ [BidHub] Bid failed:", err)
        throw err
      }
    },
    [isConnected],
  )

  const joinCarGroup = useCallback(
    async (carId: string): Promise<void> => {
      const connection = connectionRef.current
      if (!connection || !isConnected) return

      try {
        await connection.invoke("JoinAuctionCarGroup", carId)
        currentCarIdRef.current = carId
        console.log("✅ [BidHub] Joined car group:", carId)
      } catch (err) {
        console.error("❌ [BidHub] Failed to join car group:", err)
        throw err
      }
    },
    [isConnected],
  )

  const leaveCarGroup = useCallback(async (carId: string): Promise<void> => {
    const connection = connectionRef.current
    if (!connection) return

    try {
      await connection.invoke("LeaveAuctionCarGroup", carId)
      if (currentCarIdRef.current === carId) {
        currentCarIdRef.current = null
      }
      console.log("👋 [BidHub] Left car group:", carId)
    } catch (err) {
      console.error("❌ [BidHub] Failed to leave car group:", err)
    }
  }, [])

  return {
    isConnected,
    connectionState,
    placeLiveBid,
    joinCarGroup,
    leaveCarGroup,
  }
}

export default useBidHub
