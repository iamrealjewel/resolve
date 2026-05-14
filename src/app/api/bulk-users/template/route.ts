import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const [companies, departments, designations, locations, users] = await Promise.all([
      prisma.company.findMany({ select: { name: true } }),
      prisma.department.findMany({ select: { name: true } }),
      prisma.designation.findMany({ select: { title: true } }),
      prisma.location.findMany({ select: { name: true } }),
      prisma.user.findMany({ select: { email: true } }),
    ]);

    const workbook = new ExcelJS.Workbook();
    
    // 1. Create the main data entry sheet
    const mainSheet = workbook.addWorksheet("Users");
    
    // 2. Create the hidden data list sheet for dropdowns
    const listSheet = workbook.addWorksheet("DataLists");
    listSheet.state = 'hidden';

    // Populate DataLists
    const roles = Object.values(Role);
    listSheet.getColumn('A').values = ['Roles', ...roles];
    listSheet.getColumn('B').values = ['Companies', ...companies.map(c => c.name)];
    listSheet.getColumn('C').values = ['Departments', ...departments.map(d => d.name)];
    listSheet.getColumn('D').values = ['Designations', ...designations.map(d => d.title)];
    listSheet.getColumn('E').values = ['Locations', ...locations.map(l => l.name)];
    listSheet.getColumn('F').values = ['Users', ...users.map(u => u.email)];

    // Define main sheet columns
    mainSheet.columns = [
      { header: 'Name*', key: 'name', width: 25 },
      { header: 'Email*', key: 'email', width: 30 },
      { header: 'Role*', key: 'role', width: 20 },
      { header: 'Company*', key: 'company', width: 25 },
      { header: 'Department', key: 'department', width: 25 },
      { header: 'Designation', key: 'designation', width: 25 },
      { header: 'Location', key: 'location', width: 25 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Superior Email', key: 'superior', width: 30 },
      { header: 'Password (Optional)', key: 'password', width: 25 },
    ];

    // Style headers
    mainSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    mainSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0176D3' }
    };

    // Add 1000 rows with data validation rules
    for (let i = 2; i <= 1000; i++) {
      // Role
      mainSheet.getCell(`C${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`DataLists!$A$2:$A$${roles.length + 1}`],
        showErrorMessage: true,
        errorTitle: 'Invalid Role',
        error: 'Please select a role from the dropdown.'
      };
      
      // Company
      if (companies.length > 0) {
        mainSheet.getCell(`D${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`DataLists!$B$2:$B$${companies.length + 1}`],
          showErrorMessage: true,
          error: 'Please select a valid company.'
        };
      }

      // Department
      if (departments.length > 0) {
        mainSheet.getCell(`E${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`DataLists!$C$2:$C$${departments.length + 1}`],
          showErrorMessage: true,
          error: 'Please select a valid department.'
        };
      }

      // Designation
      if (designations.length > 0) {
        mainSheet.getCell(`F${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`DataLists!$D$2:$D$${designations.length + 1}`],
          showErrorMessage: true,
          error: 'Please select a valid designation.'
        };
      }

      // Location
      if (locations.length > 0) {
        mainSheet.getCell(`G${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`DataLists!$E$2:$E$${locations.length + 1}`],
          showErrorMessage: true,
          error: 'Please select a valid location.'
        };
      }

      // Superior Email
      if (users.length > 0) {
        mainSheet.getCell(`I${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`DataLists!$F$2:$F$${users.length + 1}`],
          showErrorMessage: true,
          error: 'Please select a valid user email.'
        };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=Bulk_User_Creation_Template.xlsx",
      },
    });
  } catch (error) {
    console.error("TEMPLATE_ERROR:", error);
    return new NextResponse("Failed to generate template", { status: 500 });
  }
}
