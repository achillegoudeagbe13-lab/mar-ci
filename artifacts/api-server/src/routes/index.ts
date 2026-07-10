import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marciRouter from "./marci";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marciRouter);

export default router;
