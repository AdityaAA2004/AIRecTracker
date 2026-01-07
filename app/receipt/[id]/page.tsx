"use client";

import { useParams } from "next/navigation";

function ReceiptPage() {
    const params= useParams<{id: string}>();
  return (
    <div>ReceiptPage: {params.id}</div>
  )
}

export default ReceiptPage