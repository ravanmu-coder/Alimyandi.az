"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import * as signalR from "@microsoft/signalr"
import { toast } from "react-hot-toast"
import { useAuctionStore } from "../stores/auctionStore"

/**
 * useAuctionHub
 *
 * AuctionHub SignalR connection-u idarə edir
 * Backend URL: /auctionHub
 *
 * Event-lər (Case-Sensitive!):
 * - TimerTick
 * - AuctionTimerReset
 * - AuctionStarted
 * - AuctionEnded
 * - AuctionPaused (optional)
 */

interface UseAuctionHubProps {
  baseUrl: string
  token: string
  auctionId: string | null
}

interface UseAuctionHubReturn {
  isConnected: boolean
  connectionState: string
  joinAuctionGroup: (auctionId: string) => Promise<void>
  leaveAuctionGroup: (auctionId: string) => Promise<void>
}

export const useAuctionHub = ({ baseUrl, token, auctionId }: UseAuctionHubProps): UseAuctionHubReturn => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<string>("Disconnected")
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const currentAuctionIdRef = useRef<string | null>(null)

  // Store actions
  const setRemainingSeconds = useAuctionStore((state) => state.setRemainingSeconds)
  const resetTimer = useAuctionStore((state) => state.resetTimer)
  const startAuction = useAuctionStore((state) => state.startAuction)
  const endAuction = useAuctionStore((state) => state.endAuction)
  const pauseAuction = useAuctionStore((state) => state.pauseAuction)

  // ========================================
  // CONNECTION SETUP
  // ========================================

  useEffect(() => {
    const AUCTION_HUB_URL = `${baseUrl}/auctionHub`

    console.log("🔌 [AuctionHub] Initializing connection to:", AUCTION_HUB_URL)

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(AUCTION_HUB_URL, {
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

    /**
     * TimerTick - Backend hər saniyə göndərir (30 saniyədən 0-a)
     */
    connection.on(
      "TimerTick",
      (data: {
        auctionId?: string
        auctionCarId?: string
        remainingSeconds: number
        isExpired?: boolean
        currentCarLotNumber?: string
      }) => {
        console.log("⏰ [AuctionHub] TimerTick received:", {
          remaining: data.remainingSeconds,
          expired: data.isExpired,
          carId: data.auctionCarId,
        })

        // Update store immediately (server-authoritative!)
        setRemainingSeconds(data.remainingSeconds)

        // Timer expired
        if (data.isExpired && data.remainingSeconds === 0) {
          console.log("⏱️ [AuctionHub] Timer expired - waiting for next car")
          toast("⏰ Time's up - moving to next vehicle...", {
            id: "timer-expired",
            icon: "⏭️",
            duration: 3000,
          })
        }
      },
    )

    /**
     * AuctionTimerReset - Yeni bid gələndə timer 30 saniyəyə reset olur
     */
    connection.on(
      "AuctionTimerReset",
      (data: {
        auctionCarId: string
        newTimerSeconds: number
        lotNumber?: string
      }) => {
        console.log("🔄 [AuctionHub] AuctionTimerReset received:", {
          newTime: data.newTimerSeconds,
          carId: data.auctionCarId,
          lot: data.lotNumber,
        })

        // Reset timer immediately to new value (usually 30 seconds)
        resetTimer(data.newTimerSeconds)

        // Visual feedback
        toast.success(`⏰ Timer reset to ${data.newTimerSeconds}s!`, {
          id: "timer-reset",
          icon: "🔄",
          duration: 2000,
        })
      },
    )

    /**
     * AuctionStarted - Hərrac başladı
     */
    connection.on("AuctionStarted", (data: { auctionId: string }) => {
      console.log("🚀 [AuctionHub] AuctionStarted:", data.auctionId)
      startAuction()
      toast.success("🚀 Auction started!", { id: "auction-started", duration: 3000 })
    })

    /**
     * AuctionPaused - Hərrac dayandırıldı
     */
    connection.on("AuctionPaused", (data: { auctionId: string }) => {
      console.log("⏸️ [AuctionHub] AuctionPaused:", data.auctionId)
      pauseAuction()
      toast("⏸️ Auction paused", { id: "auction-paused", duration: 3000 })
    })

    /**
     * AuctionEnded - Hərrac bitdi
     */
    connection.on("AuctionEnded", (data: { auctionId: string }) => {
      console.log("🏁 [AuctionHub] AuctionEnded:", data.auctionId)
      endAuction()
      toast.success("🏁 Auction ended!", { id: "auction-ended", duration: 5000 })
    })

    /**
     * CarMoved - Server növbəti maşına keçid etdikdə
     */
    connection.on(
      "CarMoved",
      (data: {
        newCarId: string
        newLotNumber: string
        previousCarId?: string
        winner?: { userId: string; userName: string; amount: number }
      }) => {
        console.log("🚗 [AuctionHub] CarMoved:", data)

        // Winner toast
        if (data.winner) {
          toast.success(`🏆 Lot sold to ${data.winner.userName} for $${data.winner.amount.toLocaleString()}!`, {
            id: "car-winner",
            duration: 5000,
          })
        }

        toast(`🚗 Now showing: Lot #${data.newLotNumber}`, {
          id: "car-moved",
          icon: "🚗",
          duration: 3000,
        })
      },
    )

    /**
     * CarCompleted - Maşının açıq-artırması bitdi
     */
    connection.on(
      "CarCompleted",
      (data: {
        carId: string
        lotNumber: string
        winner?: { userId: string; userName: string; amount: number }
        status: "Sold" | "Unsold"
      }) => {
        console.log("🏁 [AuctionHub] CarCompleted:", data)

        if (data.status === "Sold" && data.winner) {
          toast.success(`🎉 Sold! ${data.winner.userName} wins at $${data.winner.amount.toLocaleString()}`, {
            id: `car-complete-${data.carId}`,
            duration: 5000,
          })
        } else {
          toast("No sale - moving to next vehicle", {
            id: `car-complete-${data.carId}`,
            icon: "⏭️",
            duration: 3000,
          })
        }
      },
    )

    // ========================================
    // CONNECTION LIFECYCLE
    // ========================================

    connection.onclose((error) => {
      console.log("❌ [AuctionHub] Connection closed:", error?.message)
      setIsConnected(false)
      setConnectionState("Disconnected")
      toast.error("Disconnected from auction... reconnecting", {
        id: "auctionhub-status",
        duration: 3000,
      })
    })

    connection.onreconnecting((error) => {
      console.log("🔄 [AuctionHub] Reconnecting...", error?.message)
      setConnectionState("Reconnecting")
      toast.loading("Reconnecting to auction...", {
        id: "auctionhub-reconnect",
        duration: Number.POSITIVE_INFINITY,
      })
    })

    connection.onreconnected((connectionId) => {
      console.log("✅ [AuctionHub] Reconnected:", connectionId)
      setIsConnected(true)
      setConnectionState("Connected")
      toast.success("Reconnected to auction!", {
        id: "auctionhub-reconnect",
        duration: 3000,
      })

      // Rejoin auction group after reconnect
      if (currentAuctionIdRef.current) {
        connection
          .invoke("JoinAuctionGroup", currentAuctionIdRef.current)
          .then(() => {
            console.log("✅ [AuctionHub] Rejoined auction group:", currentAuctionIdRef.current)
          })
          .catch((err) => {
            console.error("❌ [AuctionHub] Failed to rejoin auction group:", err)
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
        console.log("✅ [AuctionHub] Connected successfully")
        setIsConnected(true)
        setConnectionState("Connected")
      } catch (err) {
        console.error("❌ [AuctionHub] Connection failed:", err)
        setConnectionState("Failed")
        toast.error("Failed to connect to auction", { id: "auctionhub-error" })
      }
    }

    startConnection()

    // ========================================
    // HEALTH CHECK (Ping/Pong every 15 seconds)
    // ========================================

    const healthCheckInterval = setInterval(() => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke("Ping").catch((err) => {
          console.warn("⚠️ [AuctionHub] Ping failed:", err)
        })
      }
    }, 15000)

    // Cleanup
    return () => {
      console.log("🧹 [AuctionHub] Cleaning up...")

      clearInterval(healthCheckInterval)

      if (currentAuctionIdRef.current) {
        connection.invoke("LeaveAuctionGroup", currentAuctionIdRef.current).catch((err) => {
          console.warn("⚠️ Failed to leave auction group:", err)
        })
      }
      connection.stop().catch((err) => {
        console.warn("⚠️ Failed to stop connection:", err)
      })
    }
  }, [baseUrl, token, setRemainingSeconds, resetTimer, startAuction, pauseAuction, endAuction])

  // ========================================
  // JOIN/LEAVE AUCTION GROUP
  // ========================================

  useEffect(() => {
    const connection = connectionRef.current
    if (!connection || !isConnected || !auctionId) return

    const joinAuctionGroup = async () => {
      try {
        // Leave previous group if exists
        if (currentAuctionIdRef.current && currentAuctionIdRef.current !== auctionId) {
          await connection.invoke("LeaveAuctionGroup", currentAuctionIdRef.current)
          console.log("👋 [AuctionHub] Left auction group:", currentAuctionIdRef.current)
        }

        // Join new group
        await connection.invoke("JoinAuctionGroup", auctionId)
        currentAuctionIdRef.current = auctionId

        console.log("✅ [AuctionHub] Joined auction group:", auctionId)
      } catch (err) {
        console.error("❌ [AuctionHub] Failed to join auction group:", err)
        toast.error("Failed to join auction", { id: "auction-join-error" })
      }
    }

    joinAuctionGroup()
  }, [auctionId, isConnected])

  // ========================================
  // METHODS
  // ========================================

  const joinAuctionGroup = useCallback(
    async (id: string): Promise<void> => {
      const connection = connectionRef.current
      if (!connection || !isConnected) return

      try {
        await connection.invoke("JoinAuctionGroup", id)
        currentAuctionIdRef.current = id
        console.log("✅ [AuctionHub] Joined auction group:", id)
      } catch (err) {
        console.error("❌ [AuctionHub] Failed to join auction group:", err)
        throw err
      }
    },
    [isConnected],
  )

  const leaveAuctionGroup = useCallback(async (id: string): Promise<void> => {
    const connection = connectionRef.current
    if (!connection) return

    try {
      await connection.invoke("LeaveAuctionGroup", id)
      if (currentAuctionIdRef.current === id) {
        currentAuctionIdRef.current = null
      }
      console.log("👋 [AuctionHub] Left auction group:", id)
    } catch (err) {
      console.error("❌ [AuctionHub] Failed to leave auction group:", err)
    }
  }, [])

  return {
    isConnected,
    connectionState,
    joinAuctionGroup,
    leaveAuctionGroup,
  }
}

export default useAuctionHub
