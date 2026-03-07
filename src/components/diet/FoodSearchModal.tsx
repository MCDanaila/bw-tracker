import { useState, useMemo } from 'react';
import { useFoods } from '@/hooks/useFoods';
import type { Food } from '@/types/database';
import { Search, X, Loader2 } from 'lucide-react';

interface FoodSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectFood: (food: Food) => void;
}

export default function FoodSearchModal({ isOpen, onClose, onSelectFood }: FoodSearchModalProps) {
    const { data: foods, isLoading, error } = useFoods();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFoods = useMemo(() => {
        if (!foods) return [];
        if (!searchQuery.trim()) return foods;
        
        const lowerQuery = searchQuery.toLowerCase();
        return foods.filter(food => food.name.toLowerCase().includes(lowerQuery));
    }, [foods, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden transform transition-all animate-slide-up">
                
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800">Sostituisci Alimento</h3>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 relative">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cerca alimento..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8b76c8]/20 focus:border-[#8b76c8] transition-all"
                        autoFocus
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-sm">Caricamento alimenti...</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 text-center text-red-500 text-sm">
                            Errore nel caricamento del database.
                        </div>
                    )}

                    {!isLoading && !error && filteredFoods.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <Search className="mb-2 opacity-20" size={32} />
                            <p className="text-sm">Nessun alimento trovato per "{searchQuery}"</p>
                        </div>
                    )}

                    {!isLoading && !error && filteredFoods.length > 0 && (
                        <ul className="space-y-1">
                            {filteredFoods.map(food => (
                                <li key={food.id}>
                                    <button
                                        onClick={() => {
                                            onSelectFood(food);
                                            setSearchQuery('');
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-[#8b76c8]/5 rounded-xl transition-colors group flex justify-between items-center border border-transparent hover:border-[#8b76c8]/10"
                                    >
                                        <div>
                                            <div className="font-medium text-gray-800 text-sm group-hover:text-[#8b76c8] transition-colors">{food.name}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5 flex gap-2">
                                                <span>{food.portion_size}{food.unit}</span>
                                                <span className="opacity-40">•</span>
                                                <span>P: {food.protein}</span>
                                                <span>C: {food.carbs}</span>
                                                <span>G: {food.fats}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs font-semibold text-gray-400 group-hover:text-[#8b76c8] transition-colors">
                                            {food.calories} kcal
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
