import { useId, useState } from "react";
import { GrantCard, GrantDetails } from "@/entities/grant";
import type { Grant } from "@/entities/grant";
import { FavoriteButton } from "@/features/toggle-favorite";
import { Button, Icon } from "@/shared/ui";

type GrantFeedProps = {
    grants: readonly Grant[];
    favoriteIds: readonly string[];
    isFavoritesView: boolean;
    hasFilters: boolean;
    onToggleFavorite: (id: string) => void;
    onResetFilters: () => void;
    onGoHome: () => void;
};

export function GrantFeed({ grants, favoriteIds, isFavoritesView, hasFilters, onToggleFavorite, onResetFilters, onGoHome }: GrantFeedProps) {
    const titleId = useId();
    const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
    const noFavorites = isFavoritesView && favoriteIds.length === 0;

    return (
        <section className="mt-6" aria-labelledby={titleId}>
            <div className="mb-4 flex items-center justify-between gap-4">
                <h2 id={titleId} className="text-[22px] leading-tight font-bold sm:text-2xl">
                    {isFavoritesView ? "Избранные гранты" : "Лента грантов"}
                </h2>
                <span className="shrink-0 text-sm font-semibold text-muted sm:text-base" role="status" aria-live="polite" aria-atomic="true">
                    {grants.length} шт.
                </span>
            </div>

            {grants.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 min-[1101px]:grid-cols-3" data-testid="grant-grid">
                    {grants.map((grant) => (
                        <GrantCard
                            key={grant.id}
                            grant={grant}
                            onOpen={() => setSelectedGrant(grant)}
                            favoriteAction={
                                <FavoriteButton grantId={grant.id} grantTitle={grant.title} saved={favoriteIds.includes(grant.id)} onToggle={() => onToggleFavorite(grant.id)} />
                            }
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3.5 rounded-[23px] border border-border bg-surface px-6 py-[54px] text-center">
                    <Icon name={noFavorites ? "star" : "search"} className="size-9 text-muted" />
                    <h3 className="text-[21px] font-bold">{noFavorites ? "Здесь будут ваши избранные гранты" : "Гранты не найдены"}</h3>
                    <p className="max-w-[440px] leading-relaxed text-muted">
                        {noFavorites ? "Нажмите на звёздочку в карточке, чтобы сохранить интересную программу." : "Попробуйте другой запрос, отрасль или этап развития бизнеса."}
                    </p>
                    {hasFilters ? (
                        <Button className="mt-2" onClick={onResetFilters}>Сбросить фильтры</Button>
                    ) : (
                        <Button className="mt-2" onClick={onGoHome}>К ленте грантов</Button>
                    )}
                </div>
            )}

            <GrantDetails grant={selectedGrant} onClose={() => setSelectedGrant(null)} />
        </section>
    );
}
