// 'use client';

// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { ButtonLoading } from '@/components/ui/loading-spinner';
// import { downloadInvoice, previewInvoice } from '@/lib/pdf-generator';
// import { toast } from 'sonner';
// import { FileText, Download, Eye, MoreVertical } from 'lucide-react';

// interface InvoiceActionsProps {
//   bookingId: string;
//   bookingData?: any;
//   variant?: 'button' | 'dropdown';
//   size?: 'sm' | 'default' | 'lg';
// }

// export const InvoiceActions: React.FC<InvoiceActionsProps> = ({
//   bookingId,
//   bookingData,
//   variant = 'button',
//   size = 'sm',
// }) => {
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [isPreviewing, setIsPreviewing] = useState(false);

//   const handleDownloadInvoice = async () => {
//     setIsGenerating(true);
//     try {
//       const response = await fetch(`/api/invoices/${bookingId}`);
      
//       if (!response.ok) {
//         throw new Error('Failed to generate invoice');
//       }

//       const blob = await response.blob();
//       const url = URL.createObjectURL(blob);
      
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `invoice-${bookingId.slice(-8)}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
      
//       URL.revokeObjectURL(url);
//       toast.success('Invoice downloaded successfully!');
//     } catch (error) {
//       logger.error('Error downloading invoice:', error);
//       toast.error('Failed to download invoice');
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const handlePreviewInvoice = async () => {
//     setIsPreviewing(true);
//     try {
//       const response = await fetch(`/api/invoices/${bookingId}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ action: 'preview' }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to get invoice data');
//       }

//       const { data: invoiceData } = await response.json();
//       await previewInvoice(invoiceData);
//     } catch (error) {
//       logger.error('Error previewing invoice:', error);
//       toast.error('Failed to preview invoice');
//     } finally {
//       setIsPreviewing(false);
//     }
//   };

//   if (variant === 'dropdown') {
//     return (
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button variant="ghost" size={size}>
//             <MoreVertical className="h-4 w-4" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end">
//           <DropdownMenuItem onClick={handlePreviewInvoice} disabled={isPreviewing}>
//             <Eye className="mr-2 h-4 w-4" />
//             {isPreviewing ? 'Loading...' : 'Preview Invoice'}
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={handleDownloadInvoice} disabled={isGenerating}>
//             <Download className="mr-2 h-4 w-4" />
//             {isGenerating ? 'Generating...' : 'Download Invoice'}
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     );
//   }

//   return (
//     <div className="flex items-center space-x-2">
//       <Button
//         variant="outline"
//         size={size}
//         onClick={handlePreviewInvoice}
//         disabled={isPreviewing}
//       >
//         <ButtonLoading isLoading={isPreviewing} loadingText="Loading...">
//           <Eye className="mr-2 h-4 w-4" />
//           Preview
//         </ButtonLoading>
//       </Button>
//       <Button
//         variant="outline"
//         size={size}
//         onClick={handleDownloadInvoice}
//         disabled={isGenerating}
//       >
//         <ButtonLoading isLoading={isGenerating} loadingText="Generating...">
//           <Download className="mr-2 h-4 w-4" />
//           Download Invoice
//         </ButtonLoading>
//       </Button>
//     </div>
//   );
// };

// // Simple invoice button for single action
// export const InvoiceButton: React.FC<{
//   bookingId: string;
//   action?: 'download' | 'preview';
//   variant?: 'default' | 'outline' | 'ghost';
//   size?: 'sm' | 'default' | 'lg';
//   children?: React.ReactNode;
// }> = ({
//   bookingId,
//   action = 'download',
//   variant = 'outline',
//   size = 'sm',
//   children,
// }) => {
//   const [isLoading, setIsLoading] = useState(false);

//   const handleClick = async () => {
//     setIsLoading(true);
//     try {
//       if (action === 'download') {
//         const response = await fetch(`/api/invoices/${bookingId}`);
        
//         if (!response.ok) {
//           throw new Error('Failed to generate invoice');
//         }

//         const blob = await response.blob();
//         const url = URL.createObjectURL(blob);
        
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = `invoice-${bookingId.slice(-8)}.pdf`;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
        
//         URL.revokeObjectURL(url);
//         toast.success('Invoice downloaded successfully!');
//       } else {
//         const response = await fetch(`/api/invoices/${bookingId}`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ action: 'preview' }),
//         });

//         if (!response.ok) {
//           throw new Error('Failed to get invoice data');
//         }

//         const { data: invoiceData } = await response.json();
//         await previewInvoice(invoiceData);
//       }
//     } catch (error) {
//       logger.error(`Error ${action}ing invoice:`, error);
//       toast.error(`Failed to ${action} invoice`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Button
//       variant={variant}
//       size={size}
//       onClick={handleClick}
//       disabled={isLoading}
//     >
//       <ButtonLoading 
//         isLoading={isLoading} 
//         loadingText={action === 'download' ? 'Generating...' : 'Loading...'}
//       >
//         {children || (
//           <>
//             {action === 'download' ? (
//               <Download className="mr-2 h-4 w-4" />
//             ) : (
//               <Eye className="mr-2 h-4 w-4" />
//             )}
//             {action === 'download' ? 'Download Invoice' : 'Preview Invoice'}
//           </>
//         )}
//       </ButtonLoading>
//     </Button>
//   );
// };
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ButtonLoading } from '@/components/ui/loading-spinner';
import { InvoicePreview } from '@/components/ui/invoice-preview';
import { downloadInvoice, previewInvoice, exportInvoiceAsImage, InvoiceData } from '@/lib/pdf-generator';
import { toast } from 'sonner';
import { FileText, Download, Eye, MoreVertical, Image } from 'lucide-react';
import { logger } from '@/lib/logger';

interface InvoiceActionsProps {
  bookingId: string;
  bookingData?: any;
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'default' | 'lg';
}

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  bookingId,
  bookingData,
  variant = 'button',
  size = 'sm',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchInvoiceData = async (): Promise<InvoiceData> => {
    const response = await fetch(`/api/invoices/${bookingId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'get-data' }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch invoice data');
    }

    const result = await response.json();
    return result.data;
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const data = await fetchInvoiceData();
      await downloadInvoice(data);
      toast.success('Invoice PDF downloaded successfully!');
    } catch (error) {
      logger.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewInvoice = async () => {
    setIsPreviewing(true);
    try {
      const data = await fetchInvoiceData();
      setInvoiceData(data);
      setShowPreview(true);
    } catch (error) {
      logger.error('Error previewing invoice:', error);
      toast.error('Failed to preview invoice');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExportImage = async () => {
    setIsExportingImage(true);
    try {
      if (!invoiceData) {
        const data = await fetchInvoiceData();
        setInvoiceData(data);
      }
      
      // Wait a bit for the component to render
      setTimeout(async () => {
        try {
          await exportInvoiceAsImage('invoice-preview-modal', `invoice-${bookingId.slice(-8)}.png`);
          toast.success('Invoice image exported successfully!');
        } catch (error) {
          logger.error('Error exporting image:', error);
          toast.error('Failed to export invoice as image');
        } finally {
          setIsExportingImage(false);
        }
      }, 500);
    } catch (error) {
      logger.error('Error preparing image export:', error);
      toast.error('Failed to prepare invoice for image export');
      setIsExportingImage(false);
    }
  };

  const handleOpenPDFPreview = async () => {
    try {
      const data = await fetchInvoiceData();
      await previewInvoice(data);
    } catch (error) {
      logger.error('Error opening PDF preview:', error);
      toast.error('Failed to open PDF preview');
    }
  };

  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size={size}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePreviewInvoice} disabled={isPreviewing}>
              <Eye className="mr-2 h-4 w-4" />
              {isPreviewing ? 'Loading...' : 'Preview Invoice'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadPDF} disabled={isGenerating}>
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenPDFPreview}>
              <FileText className="mr-2 h-4 w-4" />
              Open PDF Preview
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
              <DialogDescription>
                Preview your invoice and export as PDF or image
              </DialogDescription>
            </DialogHeader>
            
            {invoiceData && (
              <>
                <InvoicePreview 
                  data={invoiceData} 
                  id="invoice-preview-modal"
                  className="border rounded-lg"
                />
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={handleExportImage}
                    disabled={isExportingImage}
                  >
                    <ButtonLoading isLoading={isExportingImage} loadingText="Exporting...">
                      <Image className="mr-2 h-4 w-4" />
                      Export as Image
                    </ButtonLoading>
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                  >
                    <ButtonLoading isLoading={isGenerating} loadingText="Generating...">
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </ButtonLoading>
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size={size}
          onClick={handlePreviewInvoice}
          disabled={isPreviewing}
        >
          <ButtonLoading isLoading={isPreviewing} loadingText="Loading...">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </ButtonLoading>
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={handleDownloadPDF}
          disabled={isGenerating}
        >
          <ButtonLoading isLoading={isGenerating} loadingText="Generating...">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </ButtonLoading>
        </Button>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Preview your invoice and export as PDF or image
            </DialogDescription>
          </DialogHeader>
          
          {invoiceData && (
            <>
              <InvoicePreview 
                data={invoiceData} 
                id="invoice-preview-modal"
                className="border rounded-lg"
              />
              
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={handleExportImage}
                  disabled={isExportingImage}
                >
                  <ButtonLoading isLoading={isExportingImage} loadingText="Exporting...">
                    <Image className="mr-2 h-4 w-4" />
                    Export as Image
                  </ButtonLoading>
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                >
                  <ButtonLoading isLoading={isGenerating} loadingText="Generating...">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </ButtonLoading>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Simple invoice button for single action
export const InvoiceButton: React.FC<{
  bookingId: string;
  action?: 'download' | 'preview' | 'image';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  children?: React.ReactNode;
}> = ({
  bookingId,
  action = 'download',
  variant = 'outline',
  size = 'sm',
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/invoices/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get-data' }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice data');
      }

      const result = await response.json();
      const data: InvoiceData = result.data;

      if (action === 'download') {
        await downloadInvoice(data);
        toast.success('Invoice PDF downloaded successfully!');
      } else if (action === 'preview') {
        await previewInvoice(data);
      } else if (action === 'image') {
        // For image export, we need to show the preview first
        toast.info('Please use the preview option to export as image');
      }
    } catch (error) {
      logger.error(`Error ${action}ing invoice:`, error);
      toast.error(`Failed to ${action} invoice`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
    >
      <ButtonLoading 
        isLoading={isLoading} 
        loadingText={action === 'download' ? 'Generating...' : 'Loading...'}
      >
        {children || (
          <>
            {action === 'download' ? (
              <Download className="mr-2 h-4 w-4" />
            ) : action === 'image' ? (
              <Image className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {action === 'download' ? 'Download PDF' : 
             action === 'image' ? 'Export Image' : 'Preview Invoice'}
          </>
        )}
      </ButtonLoading>
    </Button>
  );
};
