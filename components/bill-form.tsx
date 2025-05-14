"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Bill } from "@/lib/actions"

type Item = {
  product_name: string
  quantity: number
  price_per_unit: number
}

interface BillFormProps {
  action: (formData: FormData) => Promise<any>
  bill?: Bill
  isEdit?: boolean
}

export function BillForm({ action, bill, isEdit }: BillFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [items, setItems] = useState<Item[]>([
    { product_name: "", quantity: 1, price_per_unit: 0 }
  ])
  const [paidAmount, setPaidAmount] = useState(0)

  // Prefill form fields when editing
  useEffect(() => {
    if (bill) {
      setCustomerName(bill.customer_name)
      setItems([
        {
          product_name: bill.product_name,
          quantity: bill.quantity,
          price_per_unit: bill.price_per_unit,
        },
      ])
      setPaidAmount(bill.paid_amount)
    }
  }, [bill])

  const handleChange = (idx: number, field: keyof Item, value: string | number) => {
    setItems(items =>
      items.map((item, i) =>
        i === idx ? { ...item, [field]: field === "product_name" ? value : Number(value) } : item
      )
    )
  }

  const addItem = () => {
    setItems([...items, { product_name: "", quantity: 1, price_per_unit: 0 }])
  }

  const removeItem = (idx: number) => {
    setItems(items => items.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData()
    
    // Add customer name
    formData.append("customer_name", customerName)
    
    // Add all items
    items.forEach((item, idx) => {
      formData.append(`items[${idx}][product_name]`, item.product_name)
      formData.append(`items[${idx}][quantity]`, String(item.quantity))
      formData.append(`items[${idx}][price_per_unit]`, String(item.price_per_unit))
    })
    
    // Add paidAmount as a separate field
    formData.append("paidAmount", String(paidAmount))
    
    await action(formData)
    setIsSubmitting(false)
  }

  const totalSum = items.reduce((sum, item) => sum + item.quantity * item.price_per_unit, 0)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Bill" : "Add Multiple Products"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Customer Name *</Label>
            <Input
              name="customer_name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              required
            />
          </div>
          {items.map((item, idx) => {
            const total = item.quantity * item.price_per_unit
            const paid_amount = totalSum > 0 ? (paidAmount * total) / totalSum : 0
            const remaining_amount = total - paid_amount
            return (
              <div key={idx} className="border p-4 rounded mb-2 relative">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input
                    name={`items[${idx}][product_name]`}
                    value={item.product_name}
                    onChange={e => handleChange(idx, "product_name", e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      name={`items[${idx}][quantity]`}
                      value={item.quantity}
                      onChange={e => handleChange(idx, "quantity", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price per Unit *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      name={`items[${idx}][price_per_unit]`}
                      value={item.price_per_unit}
                      onChange={e => handleChange(idx, "price_per_unit", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Label>Total</Label>
                  <Input value={total.toFixed(2)} readOnly />
                </div>
                <div className="mt-2">
                  <Label>Remaining Amount</Label>
                  <Input value={remaining_amount.toFixed(2)} readOnly />
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => removeItem(idx)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            )
          })}
          <Button type="button" onClick={addItem} variant="outline">
            + Add Another Product
          </Button>
          <div className="mt-4">
            <Label>Paid Amount (for all products)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={e => setPaidAmount(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div className="mt-2">
            <Label>Total Amount</Label>
            <Input value={totalSum.toFixed(2)} readOnly />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Update Bill" : "Add Products"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}