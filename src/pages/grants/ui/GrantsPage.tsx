import { useEffect, useRef, useState } from "react";
import { useUiMotion } from "@/shared/lib/use-ui-motion";
import { GrantDetails, grants, type Grant } from "@/entities/grant";
import { filterGrants, useGrantFilters } from "@/features/filter-grants";
import { useFavorites } from "@/features/toggle-favorite";
import { readBusinessProfile } from "@/features/match-business";
import backgroundImage from "@/shared/assets/home/background.png";
import { BottomNavigation } from "@/widgets/bottom-navigation";
import { CatalogScreen } from "./CatalogScreen";
import { ChatScreen } from "./ChatScreen";
import { HomeScreen } from "./HomeScreen";
import { ProfileScreen } from "./ProfileScreen";

type View = "home" | "catalog" | "favorites" | "profile" | "assistant";
const grantIds = grants.map((grant) => grant.id);
const views: View[] = ["home", "catalog", "favorites", "profile", "assistant"];

function readView(): View {
    const hash = window.location.hash.slice(1);
    return views.find((view) => view === hash) ?? "home";
}

export function GrantsPage() {
    const shellRef = useRef<HTMLDivElement>(null);
    const [view, setView] = useState<View>(readView);
    useUiMotion(shellRef, view);
    const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
    const [businessProfile, setBusinessProfile] = useState(readBusinessProfile);
    const { favoriteIds, toggleFavorite } = useFavorites(grantIds);
    const catalog = useGrantFilters();
    const favorites = useGrantFilters();
    const currentFilters = view === "favorites" ? favorites : catalog;
    const availableGrants = view === "favorites" ? grants.filter((grant) => favoriteIds.includes(grant.id)) : grants;
    const visibleGrants = filterGrants(availableGrants, currentFilters.filters);

    useEffect(() => {
        function handleNavigation() {
            setView(readView());
            setSelectedGrant(null);
            setBusinessProfile(readBusinessProfile());
            window.scrollTo({ top: 0, behavior: "instant" });
        }
        window.addEventListener("hashchange", handleNavigation);
        return () => window.removeEventListener("hashchange", handleNavigation);
    }, []);

    function navigate(nextView: View) {
        setView(nextView);
        setSelectedGrant(null);
        setBusinessProfile(readBusinessProfile());
        if (window.location.hash !== `#${nextView}`) window.location.hash = nextView;
        window.scrollTo({ top: 0, behavior: "instant" });
    }

    function selectCategory(categoryId: string) {
        catalog.applyProfile(categoryId, "");
        navigate("catalog");
    }

    return (
        <div ref={shellRef} className={`app-shell app-shell--${view}${view === "favorites" && visibleGrants.length === 0 ? " app-shell--empty" : ""} relative isolate flex min-h-dvh w-full max-w-none flex-col overflow-visible rounded-none border-0 bg-background [--app-width:100%] [--app-content-width:1248px] [--app-gutter:32px] [--app-nav-height:calc(73px+env(safe-area-inset-bottom,0px))] lg:[--app-nav-height:64px] [&_button:focus-visible]:outline-none [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-white/30 [&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-white/30`}>
            <div className={`app-backdrop fixed inset-0 after:min-h-0 ${view === "assistant" ? "after:hidden" : ""}`} aria-hidden="true"><img className="inset-0 h-full w-full object-cover" src={backgroundImage} alt="" /></div>
            <BottomNavigation activeTab={view} favoriteCount={favoriteIds.length} onNavigate={navigate} />
            {view === "home" && (
                <HomeScreen
                    query={catalog.filters.query}
                    onQueryChange={catalog.setQuery}
                    onSearch={() => {
                        catalog.setCategoryId("all");
                        catalog.setStage("");
                        navigate("catalog");
                    }}
                    onOpenProfile={() => navigate("profile")}
                    onSelectCategory={selectCategory}
                    onShowAll={() => {
                        catalog.resetFilters();
                        navigate("catalog");
                    }}
                />
            )}
            {(view === "catalog" || view === "favorites") && (
                <CatalogScreen
                    key={view}
                    grants={visibleGrants}
                    favoriteIds={favoriteIds}
                    isFavorites={view === "favorites"}
                    filters={currentFilters.filters}
                    onQueryChange={currentFilters.setQuery}
                    onCategoryChange={currentFilters.setCategoryId}
                    onStageChange={currentFilters.setStage}
                    onReset={currentFilters.resetFilters}
                    onToggleFavorite={toggleFavorite}
                    onOpenGrant={setSelectedGrant}
                />
            )}
            {view === "profile" && (
                <ProfileScreen onShowMatches={(categoryId, stage) => {
                    catalog.applyProfile(categoryId, stage);
                    navigate("catalog");
                }} />
            )}
            {view === "assistant" && (
                <ChatScreen categoryId={businessProfile.categoryId || "all"} stage={businessProfile.stage} onOpenGrant={setSelectedGrant} />
            )}
            <GrantDetails
                grant={selectedGrant}
                onClose={() => setSelectedGrant(null)}
                saved={selectedGrant ? favoriteIds.includes(selectedGrant.id) : false}
                onToggleFavorite={() => {
                    if (selectedGrant) toggleFavorite(selectedGrant.id);
                }}
            />
        </div>
    );
}
