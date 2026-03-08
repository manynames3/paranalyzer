import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { BarChart3, Plus, LogOut, Trash2, Activity } from 'lucide-react';
import { fmtCurrency } from '@/utils/formatters';
import { getScoreLabel, getScoreColor, getScoreBgColor } from '@/types/dealcheck';
import { useToast } from '@/hooks/use-toast';

interface SavedDeal {
  id: string;
  label: string;
  created_at: string;
  property_id: string;
  analysis_id: string;
  properties: {
    address: string;
    city: string;
    state: string;
    asking_price: number;
  };
  deal_analyses: {
    overall_score: number;
    monthly_cash_flow: number;
    buy_hold_score: number;
    flip_score: number;
  };
}

const Dashboard = () => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deals, setDeals] = useState<SavedDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchDeals();
  }, [user]);

  const fetchDeals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_deals')
      .select('id, label, created_at, property_id, analysis_id, properties(address, city, state, asking_price), deal_analyses(overall_score, monthly_cash_flow, buy_hold_score, flip_score)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) setDeals(data as any);
    setLoading(false);
  };

  const deleteDeal = async (id: string) => {
    await supabase.from('saved_deals').delete().eq('id', id);
    setDeals((prev) => prev.filter((d) => d.id !== id));
    toast({ title: 'Deal removed' });
  };

  const getStrategy = (d: SavedDeal) => {
    const bh = d.deal_analyses.buy_hold_score;
    const fl = d.deal_analyses.flip_score;
    if (d.deal_analyses.overall_score < 50) return 'Pass';
    if (bh > fl) return 'Rental';
    return 'Flip';
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />

      <header className="relative border-b border-border/50 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dealcheck" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold">DealCheck AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <Activity className="w-4 h-4" /> PAR
              </Button>
            </Link>
            <Link to="/analyze">
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> New Deal
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-2">My Deals</h1>
        <p className="text-muted-foreground mb-8">Your saved deal analyses</p>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">No saved deals yet</p>
            <Link to="/analyze">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Analyze Your First Deal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {deals.map((d) => (
              <div key={d.id} className="glass-card rounded-xl p-5 border border-border/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{d.properties.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {d.properties.city}, {d.properties.state} • {fmtCurrency(d.properties.asking_price)}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className={`text-lg font-bold ${getScoreColor(d.deal_analyses.overall_score)}`}>
                      {d.deal_analyses.overall_score}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Cash Flow</p>
                    <p className={`text-sm font-mono font-medium ${d.deal_analyses.monthly_cash_flow >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {fmtCurrency(d.deal_analyses.monthly_cash_flow)}/mo
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Strategy</p>
                    <p className="text-sm font-medium">{getStrategy(d)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteDeal(d.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
