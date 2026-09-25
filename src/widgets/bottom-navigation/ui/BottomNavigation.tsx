import chatIcon from "@/shared/assets/home/chat.svg";
import homeActiveIcon from "@/shared/assets/home/home.svg";
import homeIcon from "@/shared/assets/catalog/home.svg";
import profileIcon from "@/shared/assets/home/profile.svg";
import profileActiveIcon from "@/shared/assets/profile/nav-active.svg";
import starIcon from "@/shared/assets/home/star.svg";

export type NavigationTab = "home" | "favorites" | "profile" | "assistant";
type BottomNavigationProps = {
    activeTab: NavigationTab | "catalog";
    favoriteCount: number;
    onNavigate: (tab: NavigationTab) => void;
};

export function BottomNavigation({ activeTab, favoriteCount, onNavigate }: BottomNavigationProps) {
    const tabs = [
        { id: "home", label: "Главная", icon: activeTab === "home" ? homeActiveIcon : homeIcon },
        { id: "favorites", label: "Избранное", icon: starIcon },
        { id: "profile", label: "Профиль", icon: activeTab === "profile" ? profileActiveIcon : profileIcon },
        { id: "assistant", label: "ИИ-помощник", icon: chatIcon },
    ] as const;
    return (
        <nav className="bottom-navigation fixed inset-x-0 bottom-0 z-10 grid w-full max-w-none transform-none grid-cols-4 rounded-none border-white/10 bg-background/75 px-2 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl lg:sticky lg:inset-auto lg:top-0 lg:flex lg:h-16 lg:basis-16 lg:items-center lg:justify-end lg:gap-2 lg:border-b lg:px-[max(2rem,calc((100%-1216px)/2))] lg:py-2" aria-label="Основная навигация">
            {tabs.map((tab) => (
                <button className="rounded-xl border border-transparent transition-colors hover:bg-white/5 aria-[current=page]:text-white lg:min-h-11 lg:gap-2 lg:px-4 lg:py-2 lg:aria-[current=page]:border-white/15 lg:aria-[current=page]:bg-white/10" type="button" key={tab.id} data-ui-motion aria-current={activeTab === tab.id ? "page" : undefined} onClick={() => onNavigate(tab.id)}>
                    <span className="bottom-navigation-icon"><img src={tab.icon} alt="" /></span>
                    <span>{tab.label}</span>
                    {tab.id === "favorites" && favoriteCount > 0 && <span className="sr-only">: {favoriteCount} сохранено</span>}
                </button>
            ))}
        </nav>
    );
}
