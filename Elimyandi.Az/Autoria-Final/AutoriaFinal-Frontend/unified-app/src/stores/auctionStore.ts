"use client"

import { create } from "zustand"
import type { AuctionDetailDto, AuctionCarDetailDto, BidGetDto } from "../types/api"

/**
 * AuctionStore - Zustand Store
 *
 * Single source of truth for live auction state
 * All SignalR events update this store
 * All components read from this store
 */

interface AuctionState {
  // Auction Info
  auctionId: string | null
  auction: AuctionDetailDto | null
  status: "Idle" | "Running" | "Paused" | "Ended"
  isLive: boolean

  // Current Car
  currentCarId: string | null
  currentCar: AuctionCarDetailDto | null

  // Bidding
  currentPrice: number
  highestBid: BidGetDto | null
  bidHistory: BidGetDto[]

  // Timer (Server-Authoritative)
  remainingSeconds: number

  // Stats
  totalBids: number
  uniqueBidders: number
  activeBidders: number

  // Connection
  isConnected: boolean

  // Actions
  setAuctionId: (id: string) => void
  setAuction: (auction: AuctionDetailDto) => void
  setCurrentCar: (car: AuctionCarDetailDto | null) => void
  setBidHistory: (bids: BidGetDto[]) => void
  setConnectionStatus: (connected: boolean) => void
  reset: () => void

  // Timer Actions
  setRemainingSeconds: (seconds: number) => void
  resetTimer: (seconds: number) => void

  // Auction Lifecycle Actions
  startAuction: () => void
  pauseAuction: () => void
  endAuction: () => void

  // Bid Actions
  updateHighestBid: (bid: BidGetDto) => void
  addBidToHistory: (bid: BidGetDto) => void

  // Stats Actions
  updateStats: (stats: { totalBids?: number; uniqueBidders?: number; activeBidders?: number }) => void
}

const initialState = {
  // Auction Info
  auctionId: null,
  auction: null,
  status: "Idle" as const,
  isLive: false,

  // Current Car
  currentCarId: null,
  currentCar: null,

  // Bidding
  currentPrice: 0,
  highestBid: null,
  bidHistory: [],

  // Timer
  remainingSeconds: 0,

  // Stats
  totalBids: 0,
  uniqueBidders: 0,
  activeBidders: 0,

  // Connection
  isConnected: false,
}

export const useAuctionStore = create<AuctionState>((set, get) => ({
  ...initialState,

  // ========================================
  // BASIC SETTERS
  // ========================================

  setAuctionId: (id: string) => {
    console.log("📝 [Store] Setting auction ID:", id)
    set({ auctionId: id })
  },

  setAuction: (auction: AuctionDetailDto) => {
    console.log("📝 [Store] Setting auction:", auction.name)
    set({
      auction,
      isLive: auction.status === "Running",
      status: auction.status as "Idle" | "Running" | "Paused" | "Ended",
    })
  },

  setCurrentCar: (car: AuctionCarDetailDto | null) => {
    if (car) {
      console.log("📝 [Store] Setting current car:", car.lotNumber, car.id)
      set({
        currentCar: car,
        currentCarId: car.id,
        currentPrice: car.currentPrice || car.minPreBid || 0,
      })
    } else {
      console.log("📝 [Store] Clearing current car")
      set({
        currentCar: null,
        currentCarId: null,
        currentPrice: 0,
        highestBid: null,
        bidHistory: [],
      })
    }
  },

  setBidHistory: (bids: BidGetDto[]) => {
    console.log("📝 [Store] Setting bid history:", bids.length, "bids")
    // Sort by timestamp descending (newest first)
    const sortedBids = [...bids].sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime()
      const timeB = new Date(b.timestamp || 0).getTime()
      return timeB - timeA
    })

    set({
      bidHistory: sortedBids,
      highestBid: sortedBids[0] || null,
      currentPrice: sortedBids[0]?.amount || get().currentCar?.currentPrice || 0,
    })
  },

  setConnectionStatus: (connected: boolean) => {
    console.log("📝 [Store] Connection status:", connected ? "Connected" : "Disconnected")
    set({ isConnected: connected })
  },

  reset: () => {
    console.log("📝 [Store] Resetting store to initial state")
    set(initialState)
  },

  // ========================================
  // TIMER ACTIONS
  // ========================================

  setRemainingSeconds: (seconds: number) => {
    // Only log every 5 seconds to reduce noise
    if (seconds % 5 === 0 || seconds <= 10) {
      console.log("⏰ [Store] Timer update:", seconds, "seconds")
    }
    set({ remainingSeconds: seconds })
  },

  resetTimer: (seconds: number) => {
    console.log("🔄 [Store] Timer reset to:", seconds, "seconds")
    set({ remainingSeconds: seconds })
  },

  // ========================================
  // AUCTION LIFECYCLE ACTIONS
  // ========================================

  startAuction: () => {
    console.log("🚀 [Store] Auction started")
    set({ status: "Running", isLive: true })
  },

  pauseAuction: () => {
    console.log("⏸️ [Store] Auction paused")
    set({ status: "Paused", isLive: false })
  },

  endAuction: () => {
    console.log("🏁 [Store] Auction ended")
    set({ status: "Ended", isLive: false })
  },

  // ========================================
  // BID ACTIONS
  // ========================================

  updateHighestBid: (bid: BidGetDto) => {
    console.log("🏆 [Store] Updating highest bid:", {
      amount: bid.amount,
      user: bid.user?.firstName,
      carId: bid.auctionCarId,
    })

    const currentHighest = get().highestBid

    // Only update if this bid is higher than current highest
    if (!currentHighest || bid.amount > currentHighest.amount) {
      set({
        highestBid: bid,
        currentPrice: bid.amount,
      })
    }
  },

  addBidToHistory: (bid: BidGetDto) => {
    console.log("💰 [Store] Adding bid to history:", {
      amount: bid.amount,
      user: bid.user?.firstName,
      carId: bid.auctionCarId,
    })

    const currentHistory = get().bidHistory

    // Check if bid already exists (prevent duplicates)
    const exists = currentHistory.some((b) => b.id === bid.id || (b.amount === bid.amount && b.userId === bid.userId))

    if (!exists) {
      // Add to beginning of array (newest first)
      const newHistory = [bid, ...currentHistory]

      // Keep only last 50 bids to prevent memory issues
      const trimmedHistory = newHistory.slice(0, 50)

      set({
        bidHistory: trimmedHistory,
        totalBids: get().totalBids + 1,
      })
    } else {
      console.log("⚠️ [Store] Bid already exists in history, skipping")
    }
  },

  // ========================================
  // STATS ACTIONS
  // ========================================

  updateStats: (stats: { totalBids?: number; uniqueBidders?: number; activeBidders?: number }) => {
    console.log("📊 [Store] Updating stats:", stats)
    set((state) => ({
      totalBids: stats.totalBids ?? state.totalBids,
      uniqueBidders: stats.uniqueBidders ?? state.uniqueBidders,
      activeBidders: stats.activeBidders ?? state.activeBidders,
    }))
  },
}))

export default useAuctionStore
