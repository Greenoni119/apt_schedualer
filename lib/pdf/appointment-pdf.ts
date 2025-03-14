import { jsPDF } from 'jspdf';

interface AppointmentPdfData {
  appointmentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: string;
}

export const generateAppointmentPDF = (data: AppointmentPdfData): string => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add a title
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 153); // Dark blue
  doc.text('Appointment Confirmation', 105, 20, { align: 'center' });
  
  // Add a logo placeholder or organization name
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('AppointEase', 105, 35, { align: 'center' });
  
  // Add a horizontal line
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 102, 204); // Blue
  doc.line(20, 40, 190, 40);
  
  // Add appointment details title
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204); // Blue
  doc.text('Appointment Details', 20, 50);
  
  // Add appointment details
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  let yPos = 60;
  
  // Create a two-column layout for details
  const renderDetailRow = (label: string, value: string) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(value, 80, yPos);
    yPos += 10;
  };
  
  renderDetailRow('Confirmation #', data.appointmentNumber);
  renderDetailRow('Appointment Type', data.appointmentType);
  renderDetailRow('Date', data.appointmentDate);
  renderDetailRow('Time', data.appointmentTime);
  renderDetailRow('Duration', data.duration);
  
  // Add another horizontal line
  doc.setLineWidth(0.3);
  doc.line(20, yPos, 190, yPos);
  yPos += 15;
  
  // Add contact details title
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204); // Blue
  doc.text('Contact Information', 20, yPos);
  yPos += 10;
  
  // Add contact details
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  renderDetailRow('Name', `${data.firstName} ${data.lastName}`);
  renderDetailRow('Email', data.email);
  if (data.phone) {
    renderDetailRow('Phone', data.phone);
  }
  
  // Add footer
  yPos = 250;
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128); // Gray
  doc.text('This is an automatically generated confirmation of your appointment.', 105, yPos, { align: 'center' });
  doc.text('Please keep this document for your records.', 105, yPos + 6, { align: 'center' });
  doc.text('If you need to reschedule or cancel, please contact us with your confirmation number.', 105, yPos + 12, { align: 'center' });
  
  // Current date at bottom
  const today = new Date();
  const dateString = today.toLocaleDateString();
  doc.text(`Generated on: ${dateString}`, 105, yPos + 20, { align: 'center' });
  
  // Return the PDF as a data URL
  return doc.output('datauristring');
};