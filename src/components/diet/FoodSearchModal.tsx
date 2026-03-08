import { useState, useMemo } from 'react';
import { useFoods } from '@/hooks/useFoods';
import type { Food } from '@/types/database';
import { Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 bg-card text-card-foreground">
                <DialogHeader className="px-4 py-3 border-b border-border/50 bg-muted/20">
                    <DialogTitle className="text-foreground">Sostituisci Alimento</DialogTitle>
                </DialogHeader>

                {/* Search Bar */}
                <div className="p-4 border-b border-border/50 relative bg-card">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Cerca alimento..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                        autoFocus
                    />
                </div>

                {/* Content Area */}
                <ScrollArea className="h-[400px] w-full p-2 bg-card">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 mt-20">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-sm">Caricamento alimenti...</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 text-center text-red-500 text-sm mt-10">
                            Errore nel caricamento del database.
                        </div>
                    )}

                    {!isLoading && !error && filteredFoods.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center mt-10">
                            <Search className="mb-2 opacity-20" size={32} />
                            <p className="text-sm">Nessun alimento trovato per "{searchQuery}"</p>
                        </div>
                    )}

                    {!isLoading && !error && filteredFoods.length > 0 && (
                        <ul className="space-y-1 pb-4">
                            {filteredFoods.map(food => (
                                <li key={food.id}>
                                    <button
                                        onClick={() => {
                                            onSelectFood(food);
                                            setSearchQuery('');
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-primary/5 rounded-xl transition-colors group flex justify-between items-center border border-transparent hover:border-primary/10"
                                    >
                                        <div>
                                            <div className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{food.name}</div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-2">
                                                <span>{food.portion_size}{food.unit}</span>
                                                <span className="opacity-40">•</span>
                                                <span>P: {food.protein}</span>
                                                <span>C: {food.carbs}</span>
                                                <span>G: {food.fats}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                                            {food.calories} kcal
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
