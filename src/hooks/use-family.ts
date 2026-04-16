"use client"

import { useQuery } from "@tanstack/react-query"

interface FamilyMember {
  id: string
  displayName: string
  avatarUrl?: string | null
  role: "PARENT" | "CHILD"
}

interface Family {
  id: string
  name: string
  members: FamilyMember[]
}

interface FamilyData {
  family: Family
  currentMember: FamilyMember
}

async function fetchFamily(): Promise<FamilyData> {
  const response = await fetch("/api/family")
  if (!response.ok) {
    throw new Error("Failed to fetch family data")
  }
  const data = await response.json()
  return data.data
}

export function useFamily() {
  return useQuery<FamilyData>({
    queryKey: ["family"],
    queryFn: fetchFamily,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
