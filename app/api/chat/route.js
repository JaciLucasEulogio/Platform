import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const { message } = await request.json();
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key no configurada" },
        { status: 500 }
      );
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: message }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No se obtuvo respuesta";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error(error.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al conectar con Gemini" },
      { status: 500 }
    );
  }
}