import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Image
        src="/main/logo.svg"
        alt="Loading"
        width={34}
        height={34}
        className="animate-spin"
      />
    </div>
  );
}
