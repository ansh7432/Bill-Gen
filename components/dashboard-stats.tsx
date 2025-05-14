"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Bill } from "@/lib/actions"
import { useMemo } from "react"

interface DashboardStatsProps {
  bills: Bill[]
  selectedCustomer: string | null
}

export function DashboardStats({ bills, selectedCustomer }: DashboardStatsProps) {
  // Calculate stats based on selected customer or all bills
  const stats = useMemo(() => {
    const filteredBills = selectedCustomer 
      ? bills.filter(bill => bill.customer_name === selectedCustomer)
      : bills

    const totalBills = filteredBills.length
    const totalAmount = filteredBills.reduce((sum, bill) => sum + bill.total, 0)
    const totalPaid = filteredBills.reduce((sum, bill) => sum + bill.paid_amount, 0)
    const totalRemaining = filteredBills.reduce((sum, bill) => sum + bill.remaining_amount, 0)

    return { totalBills, totalAmount, totalPaid, totalRemaining }
  }, [bills, selectedCustomer])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {selectedCustomer ? `${selectedCustomer}'s Bills` : "Total Products"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBills}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {selectedCustomer ? `${selectedCustomer}'s Total` : "Total Amount"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.totalAmount.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {selectedCustomer ? `${selectedCustomer}'s Paid` : "Total Paid"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.totalPaid.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {selectedCustomer ? `${selectedCustomer}'s Remaining` : "Total Remaining"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.totalRemaining.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  )
}