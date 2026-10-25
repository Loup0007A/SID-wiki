export default function Mention({ nickname }: { nickname: string }) {
  return (
    <span className="mx-0.5 inline-block rounded-md bg-brass-400/15 px-1.5 align-baseline font-body text-[0.95em] font-semibold text-brass-300 ring-1 ring-inset ring-brass-400/30">
      @{nickname}
    </span>
  );
}
