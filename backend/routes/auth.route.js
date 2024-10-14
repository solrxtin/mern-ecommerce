import { Router} from "express";
import { loginController, logoutController, regenerateAccessToken, registerController } from "../controllers/auth.controller.js";


const router = Router();

router.post("/login", loginController);
router.post("/logout", logoutController);
router.post("/register", registerController);
router.post("/refresh", regenerateAccessToken)

export default router