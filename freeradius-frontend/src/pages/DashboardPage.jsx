// src/pages/DashboardPage.jsx
import useAuthStore from '@/store/authStore';

export default function DashboardPage() {
    const { user } = useAuthStore();
    return (
        <div>
            <h1 className="text-2xl font-bold">Welcome to the Dashboard, {user?.username}!</h1>
            <p className="text-muted-foreground mt-2">This is where your main dashboard content will be.</p>
        </div>
    );
}