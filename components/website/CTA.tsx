import Image from "next/image";
import Link from "next/link";

const CTA = () => {
  return (
    <section className="relative flex items-center justify-center min-h-[50vh] overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1434596922112-19c563067271?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Background"
        className="object-cover w-full absolute inset-0 h-full"
        fill
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="relative z-10 flex flex-col items-center justify-center max-w-7xl p-8 text-center text-white">
        <div className="flex flex-col items-center max-w-xl p-8 md:p-0">
          <h2 className="font-bold text-3xl md:text-5xl tracking-tight mb-8 md:mb-12">
            Leve seus treinamentos ao próximo nível com Pump
          </h2>
          <p className="text-lg opacity-80 mb-12 md:mb-16">
            Diga adeus às planilhas obsoletas e abrace um sistema integrado para avaliação e treinamento
          </p>
          <Link href="/#pricing" className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 md:py-4 md:text-lg md:px-10 min-w-[12rem] transition-colors">Comece agora com Pump</Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
