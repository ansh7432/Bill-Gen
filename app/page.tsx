import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardStats } from "@/components/dashboard-stats"
import { BillTable } from "@/components/bill-table"
import { getBills } from "@/lib/actions"
import { PlusCircle } from "lucide-react"

export default async function Home() {
  const bills = await getBills()

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bill Management</h1>
        <Link href="/add-bill">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Bill
          </Button>
        </Link>
      </div>

      <DashboardStats />

      <div className="rounded-md border">
        <BillTable bills={bills} />
      </div>
    </div>
  )
}
