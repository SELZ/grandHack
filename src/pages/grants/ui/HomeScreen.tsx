import type { FormEvent } from "react";
import { categories } from "@/entities/grant";
import arrowIcon from "@/shared/assets/home/arrow.svg";
import searchIcon from "@/shared/assets/home/search.svg";

type HomeScreenProps = {
    query: string;
    onQueryChange: (query: string) => void;
    onSearch: () => void;
    onOpenProfile: () => void;
    onSelectCategory: (categoryId: string) => void;
    onShowAll: () => void;
};

const categoryOrder = ["it", "production", "creative", "agriculture", "medicine", "construction", "education", "trade", "food", "services"];
const fullLabels: Record<string, string> = { creative: "Креативные индустрии", agriculture: "Сельское хозяйство" };

export function HomeScreen({ query, onQueryChange, onSearch, onOpenProfile, onSelectCategory, onShowAll }: HomeScreenProps) {
    function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSearch();
    }

    return (
        <main className="home-screen mx-auto grid min-h-0 w-full max-w-7xl grid-cols-1 gap-5 px-4 pt-8 pb-[calc(var(--app-nav-height)+24px)] md:gap-6 md:px-8 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-4 lg:py-8 xl:gap-x-10">
            <header className="home-hero h-auto lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-center">
                <h1 className="ml-0 text-[40px] leading-tight lg:text-5xl">Гранты<br />для вашего<br />бизнеса</h1>
                <p className="mt-3 ml-0 max-w-sm text-[15px] leading-5 md:mt-4 lg:text-base lg:leading-6">Находи подходящие гранты,<br className="lg:hidden" /> сохраняй и управляй<br className="lg:hidden" /> заявками в одном месте.</p>
            </header>
            <form className="home-search glass-surface mt-0 h-12 w-full rounded-full border border-white/20 pr-1 pl-4 shadow-none transition-colors focus-within:border-white/45 focus-within:ring-2 focus-within:ring-white/10 lg:col-start-2 lg:row-start-1 lg:h-13 lg:self-end lg:pr-1 lg:pl-4" role="search" onSubmit={handleSearch}>
                <input className="border-0 bg-transparent text-base shadow-none outline-none ring-0 focus-visible:outline-none focus-visible:ring-0" type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Поиск грантов по регионам" aria-label="Поиск грантов по регионам" />
                <button className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/10" type="submit" data-ui-motion aria-label="Найти гранты"><img src={searchIcon} alt="" /></button>
            </form>
            <section className="home-match mt-0 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/15 lg:col-start-2 lg:row-start-2 lg:self-start" aria-labelledby="business-match-title">
                <div className="home-match-copy min-h-0 bg-none p-4 lg:p-5">
                    <h2 className="text-base leading-6 lg:text-lg" id="business-match-title">Подобрать под ваш бизнес</h2>
                    <p className="mt-1 text-sm leading-5 lg:mt-2 lg:text-[15px] lg:leading-5">Заполните профиль — покажем гранты, которые подходят именно вашему бизнесу.</p>
                </div>
                <button type="button" data-ui-motion className="glass-surface h-11 rounded-none border-t border-white/10 shadow-none transition-colors hover:bg-white/25 lg:h-11" onClick={onOpenProfile}>Заполнить</button>
            </section>
            <section className="home-categories mt-2 min-w-0 lg:col-span-2 lg:mt-4" aria-labelledby="grant-categories-title">
                <h2 className="text-lg leading-6 md:text-xl md:leading-7" id="grant-categories-title">Категории грантов</h2>
                <div className="home-category-grid mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:mt-4 lg:grid-cols-5">
                    {categoryOrder.map((id) => {
                        const category = categories.find((item) => item.id === id)!;
                        return (
                            <button type="button" key={id} data-ui-motion="lift" onClick={() => onSelectCategory(id)} className="home-category glass-surface h-auto min-h-16 gap-2 px-3 py-3 text-[15px] transition-colors hover:bg-white/25 md:px-4 lg:min-h-18 lg:p-4">
                                <span>{fullLabels[id] ?? category.label}</span>
                                <img src={arrowIcon} alt="" />
                            </button>
                        );
                    })}
                </div>
                <button type="button" data-ui-motion onClick={onShowAll} className="home-show-all glass-surface mx-auto mt-4 block h-11 w-full transition-colors hover:bg-white/10 md:max-w-sm lg:mt-4">Все гранты</button>
            </section>
        </main>
    );
}
