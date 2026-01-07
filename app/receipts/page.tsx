import PDFDropComponent from "@/components/PDFDropComponent";
import ReceiptList from "@/components/ReceiptList";

function Receipts() {
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* The PDF Drop component and receipt list component go here */}
            <PDFDropComponent />
            <ReceiptList />
        </div>
    </div>
  )
}

export default Receipts; 