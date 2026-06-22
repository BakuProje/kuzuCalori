export function ClayBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="blob float-slow"
        style={{
          width: 380,
          height: 380,
          left: "-6rem",
          top: "-4rem",
          background: "var(--clay-pink)",
        }}
      />
      <div
        className="blob float-mid"
        style={{
          width: 320,
          height: 320,
          right: "-5rem",
          top: "30%",
          background: "var(--clay-mint)",
        }}
      />
      <div
        className="blob float-slow"
        style={{
          width: 280,
          height: 280,
          left: "20%",
          bottom: "-6rem",
          background: "var(--clay-peach)",
        }}
      />
      <div
        className="blob float-mid"
        style={{
          width: 220,
          height: 220,
          right: "20%",
          bottom: "10%",
          background: "var(--clay-lavender)",
        }}
      />
    </div>
  );
}
