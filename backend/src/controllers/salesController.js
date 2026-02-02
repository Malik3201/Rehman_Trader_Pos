import { createRetailSale, createWholesaleSale, getSales, getSaleById } from '../services/salesService.js';
import { generateInvoicePdf } from '../services/invoicePdfService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

async function createRetailSaleHandler(req, res, next) {
  try {
    const sale = await createRetailSale(req.validated.body, req.user.id);
    return res.status(201).json(successResponse(sale, 'Retail sale created successfully'));
  } catch (error) {
    return next(error);
  }
}

async function createWholesaleSaleHandler(req, res, next) {
  try {
    const sale = await createWholesaleSale(req.validated.body, req.user.id);
    return res.status(201).json(successResponse(sale, 'Wholesale sale created successfully'));
  } catch (error) {
    return next(error);
  }
}

async function getSalesHandler(req, res, next) {
  try {
    const filters = {
      type: req.validated.query.type,
      from: req.validated.query.from,
      to: req.validated.query.to,
      customerId: req.validated.query.customerId,
      page: parseInt(req.validated.query.page) || 1,
      limit: parseInt(req.validated.query.limit) || 20,
    };

    const result = await getSales(filters);
    return res.json(successResponse(result, 'Sales retrieved successfully'));
  } catch (error) {
    return next(error);
  }
}

async function getSaleByIdHandler(req, res, next) {
  try {
    const sale = await getSaleById(req.validated.params.id);
    return res.json(successResponse(sale, 'Sale retrieved successfully'));
  } catch (error) {
    return next(error);
  }
}

async function getInvoicePdfHandler(req, res, next) {
  try {
    const pdfBuffer = await generateInvoicePdf(req.validated.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.validated.params.id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
}

export {
  createRetailSaleHandler,
  createWholesaleSaleHandler,
  getSalesHandler,
  getSaleByIdHandler,
  getInvoicePdfHandler,
};
