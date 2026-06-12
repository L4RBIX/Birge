#!/usr/bin/env node

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const baseUrl = process.env.OTP_BASE_URL ?? "http://localhost:3000";
const phoneNumber = process.argv[2];

function maskPhone(phone) {
  if (!phone || phone.length < 7) return "***";
  return `${phone.slice(0, 5)}***${phone.slice(-4)}`;
}

function usage() {
  console.error("Usage: OTP_BASE_URL=http://localhost:3003 npm run otp:verify -- +77001234567");
}

async function postJson(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function main() {
  if (!phoneNumber || !/^\+[1-9]\d{6,14}$/.test(phoneNumber)) {
    usage();
    process.exit(64);
  }

  console.log(`[Birge OTP] baseUrl=${baseUrl}`);
  console.log(`[Birge OTP] phone=${maskPhone(phoneNumber)}`);

  const statusResponse = await fetch(`${baseUrl}/api/telecom/status`);
  const status = await statusResponse.json();
  console.log("[Birge OTP] status", {
    provider: status?.otp?.provider,
    enabled: status?.otp?.enabled,
    configured: status?.otp?.configured,
  });

  const start = await postJson("/api/telecom/otp/start", {
    phoneNumber,
    consentGiven: true,
  });

  console.log("[Birge OTP] start", {
    httpStatus: start.response.status,
    status: start.data.status,
    provider: start.data.provider,
    realSmsSent: start.data.realSmsSent,
    configured: start.data.configured,
    hasRequestId: Boolean(start.data.requestId),
    message: start.data.message,
  });

  if (start.response.status >= 400 || start.data.status !== "sent" || start.data.realSmsSent !== true) {
    console.error("[Birge OTP] Real SMS was not sent. Configure a real provider before claiming live SMS OTP.");
    process.exit(2);
  }

  let code = process.env.OTP_CODE;
  if (!code) {
    const rl = readline.createInterface({ input, output });
    code = await rl.question("Enter received OTP code: ");
    rl.close();
  }

  const checkBody = {
    phoneNumber,
    code,
  };

  if (typeof start.data.requestId === "string") {
    checkBody.requestId = start.data.requestId;
  }

  const check = await postJson("/api/telecom/otp/check", checkBody);

  console.log("[Birge OTP] check", {
    httpStatus: check.response.status,
    status: check.data.status,
    provider: check.data.provider,
    phoneVerified: check.data.phoneVerified,
    realVerification: check.data.realVerification,
    configured: check.data.configured,
    verificationType: check.data.identity?.verificationType,
    realNetworkCheck: check.data.identity?.realNetworkCheck,
    trustScore: check.data.trust?.trustScore,
    message: check.data.message,
  });

  if (check.data.status === "approved" && check.data.realVerification === true) {
    console.log("[Birge OTP] PASS: live SMS OTP verified. This is phone verification, not silent SIM/eSIM Network API verification.");
    return;
  }

  console.error("[Birge OTP] FAIL: OTP was not approved by a real provider.");
  process.exit(3);
}

main().catch((error) => {
  console.error("[Birge OTP] Verification script failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
