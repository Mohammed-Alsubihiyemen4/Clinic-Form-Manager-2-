import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import trainingCertificatesRouter from "./training-certificates";
import medicalReportsRouter from "./medical-reports";
import invoicesRouter from "./invoices";
import customersRouter from "./customers";
import doctorsRouter from "./doctors";
import usersRouter from "./users";
import settingsRouter from "./settings";
import auditLogsRouter from "./audit-logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(trainingCertificatesRouter);
router.use(medicalReportsRouter);
router.use(invoicesRouter);
router.use(customersRouter);
router.use(doctorsRouter);
router.use(usersRouter);
router.use(settingsRouter);
router.use(auditLogsRouter);

export default router;
