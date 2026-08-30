import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mementoRouter from "./memento";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mementoRouter);

export default router;
