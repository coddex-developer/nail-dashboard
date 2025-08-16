import { Trash2 } from "lucide-react";

// --- COMPONENTE DE GESTÃO DE HORÁRIOS ---
export const AvailabilityManager: React.FC<{ availability: Availability; setAvailability: React.Dispatch<React.SetStateAction<Availability>> }> = ({ availability, setAvailability }) => {
    const daysOfWeek = [
        { key: 'monday', label: 'Seg', fullName: 'Segunda-feira' },
        { key: 'tuesday', label: 'Ter', fullName: 'Terça-feira' },
        { key: 'wednesday', label: 'Qua', fullName: 'Quarta-feira' },
        { key: 'thursday', label: 'Qui', fullName: 'Quinta-feira' },
        { key: 'friday', label: 'Sex', fullName: 'Sexta-feira' },
        { key: 'saturday', label: 'Sáb', fullName: 'Sábado' },
        { key: 'sunday', label: 'Dom', fullName: 'Domingo' },
    ];

    const toggleDay = (day: keyof Availability) => {
        setAvailability(prev => {
            const currentSlots = prev[day];
            const newSlots = currentSlots.length > 0 ? [] : [{ start: '09:00', end: '18:00' }];
            return { ...prev, [day]: newSlots };
        });
    };

    const handleTimeChange = (day: keyof Availability, index: number, type: 'start' | 'end', value: string) => {
        setAvailability(prev => {
            const newSlots = [...prev[day]];
            newSlots[index][type] = value;
            return { ...prev, [day]: newSlots };
        });
    };

    const addSlot = (day: keyof Availability) => {
        setAvailability(prev => ({
            ...prev,
            [day]: [...prev[day], { start: '09:00', end: '18:00' }]
        }));
    };

    const removeSlot = (day: keyof Availability, index: number) => {
        setAvailability(prev => ({
            ...prev,
            [day]: prev[day].filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                {daysOfWeek.map(dayInfo => {
                    const dayKey = dayInfo.key as keyof Availability;
                    const isActive = availability[dayKey].length > 0;
                    return (
                        <button
                            type="button"
                            key={dayKey}
                            onClick={() => toggleDay(dayKey)}
                            className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {dayInfo.label}
                        </button>
                    );
                })}
            </div>
            <div className="space-y-4 pt-4 max-h-48 overflow-y-auto pr-2">
                {daysOfWeek.map(dayInfo => {
                    const dayKey = dayInfo.key as keyof Availability;
                    if (availability[dayKey].length > 0) {
                        return (
                            <div key={dayKey}>
                                <label className="font-semibold text-sm text-gray-800">{dayInfo.fullName}</label>
                                {availability[dayKey].map((slot, index) => (
                                    <div key={index} className="flex items-center gap-2 mt-2">
                                        <input type="time" value={slot.start} onChange={e => handleTimeChange(dayKey, index, 'start', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                        <span>-</span>
                                        <input type="time" value={slot.end} onChange={e => handleTimeChange(dayKey, index, 'end', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                        <button type="button" onClick={() => removeSlot(dayKey, index)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addSlot(dayKey)} className="text-xs text-blue-600 hover:underline mt-2">
                                    + Adicionar intervalo
                                </button>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};