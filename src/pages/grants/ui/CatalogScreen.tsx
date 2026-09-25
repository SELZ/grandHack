import { useId, useState } from "react";
import { categories, GrantCard, type Grant } from "@/entities/grant";
import { GrantFilters } from "@/features/filter-grants";
import type { GrantFiltersValue } from "@/features/filter-grants/model/filter-grants";
import { FavoriteButton } from "@/features/toggle-favorite";
import { Modal } from "@/shared/ui";
import filterIcon from "@/shared/assets/catalog/filter.svg";
import emptyStarIcon from "@/shared/assets/catalog/empty-star.svg";

type CatalogScreenProps = {
    grants: Grant[];
    favoriteIds: string[];
    isFavorites?: boolean;
    filters: GrantFiltersValue;
    onQueryChange: (query: string) => void;
    onCategoryChange: (categoryId: string) => void;
    onStageChange: (stage: string) => void;
    onReset: () => void;
    onToggleFavorite: (id: string) => void;
    onOpenGrant: (grant: Grant) => void;
};

const categoryOrder = ["it", "creative", "medicine", "education", "food", "production", "agriculture", "construction", "trade", "services"];

export function CatalogScreen({ grants, favoriteIds, isFavorites = false, filters, onQueryChange, onCategoryChange, onStageChange, onReset, onToggleFavorite, onOpenGrant }: CatalogScreenProps) {
    const [filterOpen, setFilterOpen] = useState(false);
    const filterTitleId = useId();
    const activeCategory = categories.find((category) => category.id === filters.categoryId);
    const hasFilters = Boolean(filters.query.trim() || filters.stage || filters.categoryId !== "all");
    const emptyFavorites = isFavorites && favoriteIds.length === 0;

    return (
        <main className={`catalog-screen${isFavorites ? " favorites-screen" : ""} mx-auto min-h-0 w-full max-w-7xl px-4 pt-8 pb-[calc(var(--app-nav-height)+24px)] md:px-8 lg:py-8`}>
            <header className="catalog-header px-0">
                <h1>{isFavorites ? "Избранное" : filters.categoryId === "all" ? "ВСЕ" : activeCategory?.label ?? "ВСЕ"}</h1>
                {isFavorites && <p>Сохранённые гранты</p>}
            </header>
            <div className="catalog-categories mt-3 h-auto min-h-11 gap-2 px-0 py-1 md:mt-4 md:flex-wrap md:gap-2" role="group" aria-label="Категории грантов">
                <button type="button" data-ui-motion className="catalog-filter-button transition-colors hover:bg-white/10" aria-label="Открыть фильтры" aria-expanded={filterOpen} onClick={() => setFilterOpen(true)}>
                    <img src={filterIcon} alt="" />
                    {(filters.query || filters.stage) && <span className="filter-dot" />}
                </button>
                {categoryOrder.map((id) => {
                    const category = categories.find((item) => item.id === id)!;
                    return <button key={id} type="button" data-ui-motion className="catalog-chip glass-surface min-h-8 px-3 transition-colors hover:bg-white/25" aria-pressed={filters.categoryId === id} onClick={() => onCategoryChange(filters.categoryId === id ? "all" : id)}>{id === "education" ? "Образовательные" : category.label}</button>;
                })}
            </div>
            {grants.length > 0 ? (
                <div className="catalog-feed mx-0 mt-5 grid grid-cols-1 gap-4 md:mt-5 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-5" data-testid="grant-grid">
                    {grants.map((grant) => <GrantCard key={grant.id} grant={grant} onOpen={() => onOpenGrant(grant)} favoriteAction={<FavoriteButton grantId={grant.id} grantTitle={grant.title} saved={favoriteIds.includes(grant.id)} onToggle={() => onToggleFavorite(grant.id)} />} />)}
                </div>
            ) : (
                <div className="catalog-empty" role="status">
                    <img src={emptyStarIcon} alt="" />
                    {emptyFavorites ? <p>Здесь пока пусто.<br />Отмечайте гранты звёздочкой ★ в ленте —<br />и они появятся в этом разделе</p> : <><p>Гранты не найдены.<br />Попробуйте другую категорию или измените фильтры.</p>{hasFilters && <button type="button" className="glass-surface" onClick={onReset}>Сбросить фильтры</button>}</>}
                </div>
            )}
            <Modal open={filterOpen} onClose={() => setFilterOpen(false)} titleId={filterTitleId} className="catalog-filter-dialog max-w-xl border-white/20 bg-[#202b34] text-foreground" closeLabel="Закрыть фильтры">
                <h2 className="pr-8 font-[Spectral,Georgia,serif] text-2xl" id={filterTitleId}>Фильтры грантов</h2>
                <GrantFilters filters={filters} onQueryChange={onQueryChange} onCategoryChange={onCategoryChange} onStageChange={onStageChange} onReset={onReset} />
                <button type="button" data-ui-motion className="filter-apply glass-surface mt-6 min-h-11 transition-colors hover:bg-white/25" onClick={() => setFilterOpen(false)}>Показать гранты · {grants.length}</button>
            </Modal>
        </main>
    );
}
