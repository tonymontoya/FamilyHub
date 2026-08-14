import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AppShell } from "@/components/layout/app-shell"
import { NavUser } from "@/lib/types"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get session server-side
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  // Fetch member by Better-Auth user id for navigation
  const member = await prisma.member.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      displayName: true,
      role: true,
      familyId: true,
    },
  })

  if (!member) {
    // User exists but no member record - redirect to setup
    redirect("/login")
  }

  // Get pending approvals count for parents
  let notificationCount = 0
  if (member.role === "PARENT") {
    const pendingCount = await prisma.completion.count({
      where: {
        status: "PENDING",
        chore: {
          familyId: member.familyId,
        },
      },
    })
    notificationCount = pendingCount
  }

  const user: NavUser = {
    id: member.id,
    name: member.displayName,
    role: member.role,
    email: session.user.email,
    image: session.user.image ?? null,
  }

  return (
    <AppShell user={user} initialNotificationCount={notificationCount}>
      {children}
    </AppShell>
  )
}
