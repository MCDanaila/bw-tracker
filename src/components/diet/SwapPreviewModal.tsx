import { X, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Food } from '../../types/database';
import { calculateSwap, type SwapResult } from '../../lib/swapAlgorithm';
import { useMemo } from 'react';
import { Button } from '../ui/Button';

interface SwapPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalFood: Food | null;
    originalQuantity: number;
    newFood: Food | null;
    onConfirmSwap: (swapResult: SwapResult) => void;
}

export default function SwapPreviewModal({ 
    isOpen, 
    onClose, 
    originalFood, 
    originalQuantity, 
    newFood,
    onConfirmSwap
}: SwapPreviewModalProps) {
    
    const swapResult = useMemo(() => {
        if (!originalFood || !newFood || originalQuantity <= 0) return null;
        return calculateSwap(originalFood, originalQuantity, newFood);
    }, [originalFood, originalQuantity, newFood]);

    if (!isOpen || !swapResult || !originalFood || !newFood) return null;

    const formatNum = (num: number) => num > 0 ? `+${num}` : num === 0 ? '0' : num.toString();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col overflow-hidden animate-slide-up">
                
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-[#8b76c8] text-white">
                    <h3 className="font-semibold">Conferma Sostituzione</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-6">
                    {/* The Swap Visualization */}
                    <div className="flex items-center justify-between text-center bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex-1">
                            <div className="text-xl font-bold text-gray-300 line-through decoration-2 decoration-red-400/50">{originalQuantity}{originalFood.unit}</div>
                            <div className="text-xs font-medium text-gray-500 mt-1 line-clamp-2">{originalFood.name}</div>
                        </div>
                        
                        <div className="px-2 text-[#8b76c8]">
                            <ArrowRight size={20} />
                        </div>
                        
                        <div className="flex-1">
                            {swapResult.newQuantity > 0 ? (
                                <div className="text-2xl font-black text-[#8b76c8] animate-pulse-once">{swapResult.newQuantity}{newFood.unit}</div>
                            ) : (
                                <div className="text-sm font-bold text-red-500">Impossibile</div>
                            )}
                            <div className="text-xs font-medium text-gray-800 mt-1 line-clamp-2">{newFood.name}</div>
                        </div>
                    </div>

                    {/* Macro Details */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Impatto Macros</p>
                        
                        {/* Target Macro Info */}
                        <div className="bg-[#8b76c8]/5 border border-[#8b76c8]/20 rounded-lg p-3 mb-3 flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-[#8b76c8] mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-700">
                                Calcolo basato sul mantenimento di <strong className="text-[#8b76c8]">{swapResult.targetAmount.toFixed(1)}g di {swapResult.primaryMacro === 'P' ? 'Proteine' : swapResult.primaryMacro === 'C' ? 'Carboidrati' : 'Grassi'}</strong>.
                            </p>
                        </div>

                        {/* Differences Grid */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className={`p-2 rounded-lg border ${swapResult.macroDifferences.kcal > 50 ? 'bg-red-50 border-red-100 text-red-700' : swapResult.macroDifferences.kcal < -50 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                                <div className="text-[10px] font-medium opacity-70">KCAL</div>
                                <div className="font-bold text-sm tracking-tighter">{formatNum(Math.round(swapResult.macroDifferences.kcal))}</div>
                            </div>
                            <div className="p-2 rounded-lg border bg-gray-50 border-gray-100 text-gray-600">
                                <div className="text-[10px] font-medium opacity-70">P</div>
                                <div className="font-bold text-sm tracking-tighter">{formatNum(Number(swapResult.macroDifferences.p.toFixed(1)))}</div>
                            </div>
                            <div className={`p-2 rounded-lg border ${Math.abs(swapResult.macroDifferences.c) > 10 ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                                <div className="text-[10px] font-medium opacity-70">C</div>
                                <div className="font-bold text-sm tracking-tighter">{formatNum(Number(swapResult.macroDifferences.c.toFixed(1)))}</div>
                            </div>
                            <div className={`p-2 rounded-lg border ${Math.abs(swapResult.macroDifferences.g) > 5 ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                                <div className="text-[10px] font-medium opacity-70">G</div>
                                <div className="font-bold text-sm tracking-tighter">{formatNum(Number(swapResult.macroDifferences.g.toFixed(1)))}</div>
                            </div>
                        </div>
                    </div>

                    {/* Warnings */}
                    {swapResult.warnings.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {swapResult.warnings.map((warning, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                    <span>{warning}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Annulla</Button>
                    <Button 
                        className="flex-1 bg-[#8b76c8] hover:bg-[#7a64b9] text-white" 
                        onClick={() => onConfirmSwap(swapResult)}
                        disabled={swapResult.targetAmount === 0 || swapResult.newQuantity === 0}
                    >
                        Conferma
                    </Button>
                </div>
            </div>
        </div>
    );
}
