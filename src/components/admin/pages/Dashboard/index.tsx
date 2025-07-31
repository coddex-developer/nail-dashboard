import { CalendarClock, ClipboardCheck, ClipboardClock, User } from "lucide-react";

export default function Dashboard() {

    return (
        <>
            <div className="container-dashboard flex items-center justify-center w-full p-3">
                <div className="cards-dashboard grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 text-center gap-6 md:gap-4 lg:gap-3">

                    <div className="w-full min-w-90 lg:min-w-50 card-dashboard flex bg-white rounded-b-sm shadow-2xl justify-between gap-4 p-8">
                        <CalendarClock className="bg-blue-900 transition-all rounded-sm text-white size-12 p-0.5"></CalendarClock>
                        <div className="content-info">
                            <p className="text-md text-cyan-950 font-extrabold">Horários marcados</p>
                            <h3 className="text-lg text-cyan-950 font-bold">0</h3>
                        </div>    
                    </div>

                    <div className="w-full card-dashboard flex bg-white  rounded-b-sm shadow-2xl justify-between gap-4 p-8">
                        <User className="bg-green-900 transition-all rounded-sm text-white size-12 p-0.5"></User>
                        <div className="content-info">
                            <p className="text-md text-cyan-950 font-extrabold">Novos Clientes</p>
                            <h3 className="text-lg text-cyan-950 font-bold">0</h3>
                        </div>    
                    </div>

                    <div className="w-full card-dashboard flex bg-white  rounded-b-sm shadow-2xl justify-between gap-4 p-8">
                        <ClipboardCheck className="bg-purple-900 transition-all rounded-sm text-white size-12 p-0.5"></ClipboardCheck>
                        <div className="content-info">
                            <p className="text-md text-cyan-950 font-extrabold">Itens publicados</p>
                            <h3 className="text-lg text-cyan-950 font-bold">0</h3>
                        </div>    
                    </div>

                    <div className="w-full card-dashboard flex bg-white  rounded-b-sm shadow-2xl justify-between gap-4 p-8">
                        <ClipboardClock className="bg-cyan-900 transition-all rounded-sm text-white size-12 p-0.5"></ClipboardClock>
                        <div className="content-info">
                            <p className="text-md text-cyan-950 font-extrabold">Itens não publicados</p>
                            <h3 className="text-lg text-cyan-950 font-bold">0</h3>
                        </div>    
                    </div>
                </div>
            </div>
        </>
    );
};