import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M3 10.5L12 3l9 7.5"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 21V11.5h14V21"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x={9.2}
            y={14.2}
            width={5.6}
            height={6.8}
            rx={0.6}
            fill="currentColor"
          />
          <rect
            x={6.2}
            y={12.2}
            width={3.6}
            height={3.6}
            rx={0.4}
            stroke="currentColor"
            strokeWidth={1.2}
            fill="none"
          />
          <path
            d="M7.999 12.2v3.6M6.2 13.999h3.6"
            stroke="currentColor"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
