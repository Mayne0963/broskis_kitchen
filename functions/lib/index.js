"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.elevateUserToAdmin = exports.getReferralCode = exports.processReferralBonus = exports.validateRedemptionCode = exports.markCouponUsed = exports.birthdayCron = exports.adminAdjustPoints = exports.redeemPoints = exports.earnPoints = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
admin.initializeApp();
// Import and export all reward functions
var earnPoints_1 = require("./rewards/earnPoints");
Object.defineProperty(exports, "earnPoints", { enumerable: true, get: function () { return earnPoints_1.earnPoints; } });
var redeemPoints_1 = require("./rewards/redeemPoints");
Object.defineProperty(exports, "redeemPoints", { enumerable: true, get: function () { return redeemPoints_1.redeemPoints; } });
var adminAdjustPoints_1 = require("./rewards/adminAdjustPoints");
Object.defineProperty(exports, "adminAdjustPoints", { enumerable: true, get: function () { return adminAdjustPoints_1.adminAdjustPoints; } });
var birthdayCron_1 = require("./rewards/birthdayCron");
Object.defineProperty(exports, "birthdayCron", { enumerable: true, get: function () { return birthdayCron_1.birthdayCron; } });
var markCouponUsed_1 = require("./rewards/markCouponUsed");
Object.defineProperty(exports, "markCouponUsed", { enumerable: true, get: function () { return markCouponUsed_1.markCouponUsed; } });
Object.defineProperty(exports, "validateRedemptionCode", { enumerable: true, get: function () { return markCouponUsed_1.validateRedemptionCode; } });
var processReferralBonus_1 = require("./rewards/processReferralBonus");
Object.defineProperty(exports, "processReferralBonus", { enumerable: true, get: function () { return processReferralBonus_1.processReferralBonus; } });
Object.defineProperty(exports, "getReferralCode", { enumerable: true, get: function () { return processReferralBonus_1.getReferralCode; } });
// Admin functions
var elevateUser_1 = require("./admin/elevateUser");
Object.defineProperty(exports, "elevateUserToAdmin", { enumerable: true, get: function () { return elevateUser_1.elevateUserToAdmin; } });
// Health check function
exports.healthCheck = functions.https.onRequest((req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});
//# sourceMappingURL=index.js.map