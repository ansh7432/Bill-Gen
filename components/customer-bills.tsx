"use client"

import { useState } from "react"
import { Bill } from "@/lib/actions"
import { BillTable } from "@/components/bill-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, Filter } from "lucide-react"
import { motion } from "framer-motion" // You'll need to install framer-motion

interface CustomerBillsProps {
  allBills: Bill[]
  selectedCustomer: string | null
  setSelectedCustomer: (customer: string | null) => void
}

export function CustomerBills({ 
  allBills, 
  selectedCustomer, 
  setSelectedCustomer 
}: CustomerBillsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  
  // Get unique customer names
  const customers = Array.from(new Set(allBills.map(b => b.customer_name))).filter(Boolean)
  
  // Filter bills by selected customer or show all if none is selected
  const filteredBills = selectedCustomer 
    ? allBills.filter(bill => bill.customer_name === selectedCustomer)
    : allBills

  // Further filter by search if provided
  const searchFilteredBills = searchQuery
    ? filteredBills.filter(bill => 
        bill.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredBills
  
  return (
    <div className="mt-12 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          {selectedCustomer ? (
            <span className="flex items-center gap-2">
              Bills for 
              <span className="font-bold text-primary">
                {selectedCustomer}
              </span>
            </span>
          ) : (
            "All Bills"
          )}
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search" 
              placeholder="Search bills..." 
              className="pl-10 pr-4 py-2 rounded-full border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedCustomer(null)}
            className="rounded-full flex items-center gap-2 border-gray-200 hover:bg-gray-50 hover:text-primary hover:border-primary transition-all"
          >
            <Users size={16} />
            View All Bills
          </Button>
        </div>
      </div>

      {/* Customer pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {customers.length === 0 ? (
          <span className="text-muted-foreground">No customers yet</span>
        ) : (
          customers.map(name => (
            <motion.span 
              key={name} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-all ${
                selectedCustomer === name 
                  ? "bg-primary text-white shadow-md" 
                  : "bg-gray-100 hover:bg-gray-200 hover:shadow-sm text-gray-700"
              }`}
              onClick={() => setSelectedCustomer(name === selectedCustomer ? null : name)}
            >
              {name}
            </motion.span>
          ))
        )}
      </div>
      
      {/* Bill table with enhanced container */}
      <div className="rounded-lg border border-gray-100 overflow-hidden">
        <BillTable bills={searchFilteredBills} />
      </div>
    </div>
  )
}