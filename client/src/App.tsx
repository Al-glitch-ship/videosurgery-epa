import { Route, Switch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { LandingPage } from "@/pages/LandingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { CreateFolderPage } from "@/pages/CreateFolderPage";
import { FolderDetailPage } from "@/pages/FolderDetailPage";
import { VideoPlayerPage } from "@/pages/VideoPlayerPage";
import { InvitesPage } from "@/pages/InvitesPage";
import { StatsPage } from "@/pages/StatsPage";
import { AdminPage } from "@/pages/AdminPage";
import { InviteAcceptPage } from "@/pages/InviteAcceptPage";

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Public routes (landing page)
  if (!user) {
    return (
      <Switch>
        <Route path="/invite/:token" component={InviteAcceptPage} />
        <Route path="/" component={LandingPage} />
        <Route path="*" component={LandingPage} />
      </Switch>
    );
  }

  // Protected routes
  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/folder/new" component={CreateFolderPage} />
        <Route path="/folder/:id" component={FolderDetailPage} />
        <Route path="/video/:id" component={VideoPlayerPage} />
        <Route path="/invites" component={InvitesPage} />
        <Route path="/stats" component={StatsPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/invite/:token" component={InviteAcceptPage} />
        <Route path="*" component={DashboardPage} />
      </Switch>
    </Layout>
  );
}

export default App;
