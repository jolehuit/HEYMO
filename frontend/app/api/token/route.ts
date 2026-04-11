/**
 * Token endpoint — generates a LiveKit token with patient_id in attributes.
 *
 * Owner: Dev 3
 * This is how the frontend tells the agent which patient was selected.
 * The patient_id is embedded in the participant's attributes, and the
 * agent reads it when the participant joins the room.
 */

import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { patientId, roomName, language } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: "LiveKit credentials not configured" },
        { status: 500 }
      );
    }

    // Generate a unique room name if not provided
    const room = roomName || `alan-call-${patientId}-${Date.now()}`;

    // Create the token with patient_id in attributes
    const token = new AccessToken(apiKey, apiSecret, {
      identity: `patient-${patientId}`,
      attributes: { patient_id: patientId, language: language || "fr" },
    });

    token.addGrant({
      room: room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    return NextResponse.json({
      token: jwt,
      url: livekitUrl,
      roomName: room,
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
