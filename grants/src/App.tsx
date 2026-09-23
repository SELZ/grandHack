import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { GrantDetails } from "./components/GrantDetails";
import { categories, filterGrants, getRegionLabel, grants, industryLabels, stageLabels } from "./data/grants";
import type { Grant } from "./data/grants";
import "./App.css";

type IconName = "search" | "star" | "home" | "user" | "chat" | "arrow" | "close" | "calendar";

function Icon({ name, filled = false }: { name: IconName; filled?: boolean }) {
    const paths: Record<IconName, ReactNode> = {
        search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
        star: <path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9L12 3Z" />,
        home: <><path d="m3 10 9-8 9 8" /><path d="M5 8.3V22h14V8.3" /></>,
        user: <><circle cx="12" cy="7" r="4" /><path d="M4 22v-2a8 8 0 0 1 16 0v2" /></>,
        chat: <path d="M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L3 21l1.4-4.7A9 9 0 1 1 21 11.5Z" />,
        arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
        close: <path d="m6 6 12 12M18 6 6 18" />,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18" /></>,
    };
    return <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const favoritesKey = "grants:favorites";

function readFavorites(): string[] {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(favoritesKey) ?? "[]");
        return Array.isArray(value)
            ? value.filter((id): id is string => typeof id === "string" && grants.some((grant) => grant.id === id))
            : [];
    } catch {
        return [];
    }
}

function GrantCard({ grant, saved, onToggleFavorite, onOpen }: {
    grant: Grant;
    saved: boolean;
    onToggleFavorite: () => void;
    onOpen: () => void;
}) {
    return (
        <article className="grant-card" aria-labelledby={`title-${grant.id}`}>
            <div className="grant-card-top">
                <p className="grant-organization" title={grant.org}>{grant.org}</p>
                <button className={`icon-button favorite-button${saved ? " is-saved" : ""}`} onClick={onToggleFavorite} aria-label={`${saved ? "Убрать из избранного" : "Добавить в избранное"}: ${grant.title}`} aria-pressed={saved}>
                    <Icon name="star" filled={saved} />
                </button>
            </div>
            <h3 id={`title-${grant.id}`}><button className="grant-title-button" onClick={onOpen}>{grant.title}</button></h3>
            <p className="grant-summary">{grant.summary}</p>
            <div className="grant-tags">
                {grant.industries.map((industry) => <span className="grant-tag" key={industry}>{industryLabels[industry] ?? industry}</span>)}
                {grant.regions.map((region) => <span className="grant-tag" key={`region-${region}`}>{getRegionLabel(region)}</span>)}
            </div>
            <div className="grant-card-bottom">
                <p className="grant-amount">{grant.amountText}</p>
                <p className="grant-deadline"><Icon name="calendar" /><span>{grant.deadlineText}</span></p>
                <button className="grant-more" onClick={onOpen}>Подробнее о гранте <Icon name="arrow" /></button>
            </div>
        </article>
    );
}

function BusinessProfile({ categoryId, stage, onApply, onClose }: {
    categoryId: string;
    stage: string;
    onApply: (category: string, stage: string) => void;
    onClose: () => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const element = dialog.current;
        element?.showModal();
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            element?.close();
            document.body.style.overflow = overflow;
        };
    }, []);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onApply(String(form.get("industry")), String(form.get("stage")));
    }

    return (
        <dialog ref={dialog} className="profile-dialog" aria-labelledby="profile-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
        }}>
            <button className="icon-button dialog-close" onClick={onClose} aria-label="Закрыть профиль"><Icon name="close" /></button>
            <span className="profile-emoji" aria-hidden="true">🎯</span>
            <h2 id="profile-title">О вашем бизнесе</h2>
            <p>Выберите отрасль и этап развития — покажем программы по этим параметрам.</p>
            <form onSubmit={handleSubmit}>
                <div className="profile-field"><label htmlFor="profile-industry">Отрасль</label><select id="profile-industry" name="industry" defaultValue={categoryId}>{categories.map((category) => <option key={category.id} value={category.id}>{category.id === "all" ? "Все отрасли" : category.label}</option>)}</select></div>
                <div className="profile-field"><label htmlFor="profile-stage">Этап развития</label><select id="profile-stage" name="stage" defaultValue={stage}><option value="">Любой этап</option>{Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <button className="primary-button" type="submit">Показать программы</button>
            </form>
        </dialog>
    );
}

function App() {
    const [query, setQuery] = useState("");
    const [categoryId, setCategoryId] = useState("all");
    const [stage, setStage] = useState("");
    const [view, setView] = useState<"home" | "favorites">("home");
    const [favorites, setFavorites] = useState(readFavorites);
    const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem(favoritesKey, JSON.stringify(favorites));
        } catch {
            // Favorites still work for this session when browser storage is unavailable.
        }
    }, [favorites]);

    const availableGrants = view === "favorites" ? grants.filter((grant) => favorites.includes(grant.id)) : grants;
    const visibleGrants = filterGrants(availableGrants, { query, categoryId, stage });
    const hasFilters = Boolean(query || categoryId !== "all" || stage);

    function toggleFavorite(id: string) {
        setFavorites((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    }

    function resetFilters() {
        setQuery("");
        setCategoryId("all");
        setStage("");
    }

    function navigate(nextView: "home" | "favorites") {
        setView(nextView);
        window.scrollTo({ top: 0, behavior: "instant" });
    }

    return (
        <>
            <main className="app-shell">
                <header className="hero">
                    <h1>Найди <span>грант</span><br />для своего дела</h1>
                    <p className="hero-subtitle">Актуальные гранты и субсидии со всей России</p>
                </header>

                <section className="filters" aria-label="Поиск и фильтры грантов">
                    <div className="search-field">
                        <Icon name="search" />
                        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск: IT, агро, оборудование…" aria-label="Поиск грантов" />
                        {query && <button className="icon-button clear-search" onClick={() => setQuery("")} aria-label="Очистить поиск"><Icon name="close" /></button>}
                    </div>
                    <div className="category-list" role="group" aria-label="Отрасль бизнеса">
                        {categories.map((category) => <button className={`category-chip${categoryId === category.id ? " is-active" : ""}`} key={category.id} aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}>{category.label}</button>)}
                    </div>
                </section>

                <section className="profile-banner" aria-labelledby="banner-title">
                    <span className="profile-emoji" aria-hidden="true">🎯</span>
                    <div className="profile-banner-copy">
                        <h2 id="banner-title">Подобрать под ваш бизнес</h2>
                        <p>Заполните профиль — покажем, какие гранты подходят именно вам</p>
                    </div>
                    <button className="primary-button" onClick={() => setProfileOpen(true)}>Заполнить</button>
                </section>

                <section className="grant-feed" aria-labelledby="feed-title">
                    <div className="feed-heading">
                        <h2 id="feed-title">{view === "favorites" ? "Избранные гранты" : "Лента грантов"}</h2>
                        <span className="grant-count" role="status" aria-live="polite" aria-atomic="true">{visibleGrants.length} шт.</span>
                    </div>
                    {stage && <div className="applied-filters"><span>{stageLabels[stage]}</span><button onClick={() => setStage("")} aria-label="Убрать фильтр по этапу"><Icon name="close" /></button></div>}
                    {visibleGrants.length > 0 ? (
                        <div className="grant-grid">
                            {visibleGrants.map((grant) => <GrantCard key={grant.id} grant={grant} saved={favorites.includes(grant.id)} onToggleFavorite={() => toggleFavorite(grant.id)} onOpen={() => setSelectedGrant(grant)} />)}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Icon name={view === "favorites" && !favorites.length ? "star" : "search"} />
                            <h3>{view === "favorites" && !favorites.length ? "Здесь будут ваши избранные гранты" : "Гранты не найдены"}</h3>
                            <p>{view === "favorites" && !favorites.length ? "Нажмите на звёздочку в карточке, чтобы сохранить интересную программу." : "Попробуйте другой запрос или выберите другую отрасль."}</p>
                            {hasFilters ? <button className="primary-button" onClick={resetFilters}>Сбросить фильтры</button> : <button className="primary-button" onClick={() => navigate("home")}>К ленте грантов</button>}
                        </div>
                    )}
                </section>
            </main>

            <nav className="bottom-navigation" aria-label="Основная навигация">
                <div className="navigation-inner">
                    <button className={`navigation-item${view === "home" ? " is-active" : ""}`} aria-current={view === "home" ? "page" : undefined} onClick={() => navigate("home")}><Icon name="home" /><span>Главная</span></button>
                    <button className={`navigation-item${view === "favorites" ? " is-active" : ""}`} aria-current={view === "favorites" ? "page" : undefined} onClick={() => navigate("favorites")}><span className="navigation-icon"><Icon name="star" />{favorites.length > 0 && <span className="favorites-count">{favorites.length}</span>}</span><span>Избранное</span></button>
                    <button className="navigation-item" onClick={() => setProfileOpen(true)}><Icon name="user" /><span>Профиль</span></button>
                    <button className="navigation-item" disabled title="ИИ-помощник скоро появится" aria-label="ИИ-помощник — скоро"><Icon name="chat" /><span>ИИ-помощник</span></button>
                </div>
            </nav>

            <GrantDetails grant={selectedGrant} onClose={() => setSelectedGrant(null)} />
            {profileOpen && <BusinessProfile categoryId={categoryId} stage={stage} onClose={() => setProfileOpen(false)} onApply={(category, nextStage) => {
                setCategoryId(category);
                setStage(nextStage);
                setQuery("");
                setView("home");
                setProfileOpen(false);
            }} />}
        </>
    );
}

export default App;
