import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrintingHero from "@/components/printing/PrintingHero";
import FileUploadSection from "@/components/printing/FileUploadSection";
import InstantQuote from "@/components/printing/InstantQuote";
import MaterialsSection from "@/components/printing/MaterialsSection";
import PrintingGallery from "@/components/printing/PrintingGallery";
import PrintingPricing from "@/components/printing/PrintingPricing";

export interface GDriveFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  size: string;
}

const Printing3D = () => {
  const [uploadedFile, setUploadedFile] = useState<GDriveFile | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PrintingHero />
      <FileUploadSection onFileUploaded={setUploadedFile} />
      <InstantQuote uploadedFile={uploadedFile} />
      <MaterialsSection />
      <PrintingGallery />
      <PrintingPricing />
      <Footer />
    </div>
  );
};

export default Printing3D;
