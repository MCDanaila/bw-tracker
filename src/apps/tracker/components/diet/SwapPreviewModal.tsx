import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Food } from '@/core/types/database';
import { calculateSwap, type SwapResult } from '@/core/lib/swapAlgorithm';
import { useMemo } from 'react';
import { Button } from '@/core/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/core/components/ui/dialog';

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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-card gap-0 text-card-foreground">
                <DialogHeader className="px-4 py-3 border-b border-border/50 bg-primary">
                    <DialogTitle className="text-primary-foreground">Conferma Sostituzione</DialogTitle>
                </DialogHeader>

                <div className="p-5 flex flex-col gap-6">
                    {/* The Swap Visualization */}
                    <div className="flex items-center justify-between text-center bg-muted/20 rounded-xl p-4 border border-border/50">
                        <div className="flex-1">
                            <div className="text-xl font-bold text-muted-foreground/50 line-through decoration-2 decoration-destructive/50">{originalQuantity}{originalFood.unit}</div>
                            <div className="text-xs font-medium text-muted-foreground mt-1 line-clamp-2">{originalFood.name}</div>
                        </div>

                        <div className="px-2 text-primary">
                            <ArrowRight size={20} />
                        </div>

                        <div className="flex-1">
                            {swapResult.newQuantity > 0 ? (
                                <div className="text-2xl font-black text-primary animate-pulse-once">{swapResult.newQuantity}{newFood.unit}</div>
                            ) : (
                                <div className="text-sm font-bold text-destructive">Impossibile</div>
                            )}
                            <div className="text-xs font-medium text-foreground mt-1 line-clamp-2">{newFood.name}</div>
                        </div>
                    </div>

                    {/* Macro Details */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Impatto Macros</p>

                        {/* Target Macro Info */}
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3 flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                            <p className="text-xs text-foreground">
                                Calculation based on maintaining <strong className="text-primary">{swapResult.targetAmount.toFixed(1)}g of {swapResult.primaryMacro === 'P' ? 'Protein' : swapResult.primaryMacro === 'C' ? 'Carbs' : 'Fats'}</strong>.
                            </p>
                        </div>

                        {/* Differences Grid */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className={`p-2 rounded-lg border ${swapResult.macroDifferences.kcal > 50 ? 'bg-destructive/10 border-destructive/20 text-destructive' : swapResult.macroDifferences.kcal < -50 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted/20 border-border/50 text-muted-foreground'}`}>
                                <div className="text-[10px] font-medium opacity-70">KCAL</div>
                                <div className="font-bold text-sm tracking-tighter">{formatNum(Math.round(swapResult.macroDifferences.kcal))}</div>
                            </div>
                            <div className="p-2 rounded-lg border bg-muted/20 border-border/50 text-muted-foreground">
                                <div className="text-[10px] font-medium opacity-70">P</div>
                                <div className="font-bold text-sm tracking-tighter">{formatNum(Number(swapResult.macroDifferences.p.toFixed(1)))}</div>
                            </div>
                            <div className={`p-2 rounded-lg border ${Math.abs(swapResult.macroDifferences.c) > 10 ? 'bg-secondary/10 border-secondary/20 text-secondary' : 'bg-muted/20 border-border/50 text-muted-foreground'}`}>
                                <div className="text-[10px] font-medium opacity-70">C</div>
                                <div className="font-bold text-sm tracking-tighter">{formatNum(Number(swapResult.macroDifferences.c.toFixed(1)))}</div>
                            </div>
                            <div className={`p-2 rounded-lg border ${Math.abs(swapResult.macroDifferences.g) > 5 ? 'bg-secondary/10 border-secondary/20 text-secondary' : 'bg-muted/20 border-border/50 text-muted-foreground'}`}>
                                <div className="text-[10px] font-medium opacity-70">G</div>
                                <div className="font-bold text-sm tracking-tighter">{formatNum(Number(swapResult.macroDifferences.g.toFixed(1)))}</div>
                            </div>
                        </div>
                    </div>

                    {/* Warnings */}
                    {swapResult.warnings.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {swapResult.warnings.map((warning, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-secondary bg-secondary/10 p-2.5 rounded-lg border border-secondary/20">
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                    <span className="text-sm">{warning}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t border-border/50 bg-muted/20 flex sm:justify-start gap-3 w-full sm:flex-row">
                    <Button variant="outline" className="flex-1 mt-0 sm:mt-0" onClick={onClose}>Cancel</Button>
                    <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => onConfirmSwap(swapResult)}
                        disabled={swapResult.targetAmount === 0 || swapResult.newQuantity === 0}
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
