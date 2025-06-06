
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { toast } from "sonner";
import { format, addMonths, differenceInMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Check, Edit, PlusCircle, Target, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Colors for the visualizations
const COLORS = [
  "#9B87F5", "#D946EF", "#6E59A5", "#D6BCFA", "#8B5CF6", 
  "#8D6FD1", "#B76EF5", "#C77DFF", "#A78BFA", "#7C3AED"
];

// Types
interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

// Example data
const initialGoals: FinancialGoal[] = [
  {
    id: "1",
    name: "Emergency Fund",
    targetAmount: 10000,
    currentAmount: 5000,
    targetDate: addMonths(new Date(), 6),
    category: "savings",
    priority: "high"
  },
  {
    id: "2",
    name: "Vacation",
    targetAmount: 3000,
    currentAmount: 1200,
    targetDate: addMonths(new Date(), 3),
    category: "travel",
    priority: "medium"
  },
  {
    id: "3",
    name: "New Laptop",
    targetAmount: 2000,
    currentAmount: 800,
    targetDate: addMonths(new Date(), 2),
    category: "technology",
    priority: "low"
  }
];

const GoalsDashboard = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>(initialGoals);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddFundsDialogOpen, setIsAddFundsDialogOpen] = useState(false);
  
  const [newGoal, setNewGoal] = useState<Partial<FinancialGoal>>({
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    targetDate: new Date(),
    category: "savings",
    priority: "medium"
  });
  
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [additionalFunds, setAdditionalFunds] = useState("");

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      toast.error("Please fill all required fields");
      return;
    }

    const goal: FinancialGoal = {
      id: Date.now().toString(),
      name: newGoal.name!,
      targetAmount: Number(newGoal.targetAmount),
      currentAmount: Number(newGoal.currentAmount || 0),
      targetDate: newGoal.targetDate!,
      category: newGoal.category || "savings",
      priority: newGoal.priority as 'low' | 'medium' | 'high' || "medium"
    };

    setGoals([...goals, goal]);
    setNewGoal({
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      targetDate: new Date(),
      category: "savings",
      priority: "medium"
    });
    setIsAddDialogOpen(false);
    toast.success(`Financial goal "${goal.name}" added successfully!`);
  };

  const handleEditGoal = () => {
    if (!selectedGoal) return;

    const updatedGoals = goals.map(goal => 
      goal.id === selectedGoal.id ? selectedGoal : goal
    );
    
    setGoals(updatedGoals);
    setIsEditDialogOpen(false);
    toast.success(`Goal "${selectedGoal.name}" updated successfully!`);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
    toast.success("Goal removed successfully");
  };

  const handleAddFunds = () => {
    if (!selectedGoal || !additionalFunds) return;

    const amount = parseFloat(additionalFunds);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const newAmount = selectedGoal.currentAmount + amount;
    const updatedGoal = {
      ...selectedGoal,
      currentAmount: newAmount > selectedGoal.targetAmount ? selectedGoal.targetAmount : newAmount
    };

    const updatedGoals = goals.map(goal => 
      goal.id === selectedGoal.id ? updatedGoal : goal
    );
    
    setGoals(updatedGoals);
    setIsAddFundsDialogOpen(false);
    setAdditionalFunds("");
    
    if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
      toast.success(`Congratulations! You've reached your goal for "${updatedGoal.name}"! 🎉`);
    } else {
      toast.success(`$${amount} added to "${updatedGoal.name}"`);
    }
  };

  // Calculate progress statistics
  const calculateTotalProgress = () => {
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const percentage = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    
    return {
      totalTarget,
      totalCurrent,
      remaining: totalTarget - totalCurrent,
      percentage
    };
  };

  const totalProgress = calculateTotalProgress();

  // Data for progress by category chart
  const progressByCategory = () => {
    const categories: Record<string, { target: number, current: number }> = {};
    
    goals.forEach(goal => {
      if (!categories[goal.category]) {
        categories[goal.category] = { target: 0, current: 0 };
      }
      categories[goal.category].target += goal.targetAmount;
      categories[goal.category].current += goal.currentAmount;
    });
    
    return Object.entries(categories).map(([category, data]) => ({
      name: category,
      Target: data.target,
      Progress: data.current,
      percentage: data.target > 0 ? (data.current / data.target) * 100 : 0
    }));
  };

  // Data for target distribution pie chart
  const goalDistributionData = () => {
    return goals.map(goal => ({
      name: goal.name,
      value: goal.targetAmount
    }));
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Financial Goals</h1>
          <p className="text-gray-400">Track your savings goals and progress</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 bg-space-purple hover:bg-space-pink text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-space-dark border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Add New Financial Goal</DialogTitle>
              <DialogDescription className="text-gray-400">
                Set a new savings target to achieve your financial dreams.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="goal-name" className="text-white">Goal Name</Label>
                <Input 
                  id="goal-name"
                  placeholder="e.g. New Car, Emergency Fund" 
                  value={newGoal.name || ""}
                  onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="target-amount" className="text-white">Target Amount</Label>
                <Input 
                  id="target-amount"
                  type="number" 
                  placeholder="0.00" 
                  step="0.01"
                  value={newGoal.targetAmount || ""}
                  onChange={(e) => setNewGoal({...newGoal, targetAmount: parseFloat(e.target.value)})}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="current-amount" className="text-white">Current Amount (Optional)</Label>
                <Input 
                  id="current-amount"
                  type="number" 
                  placeholder="0.00" 
                  step="0.01"
                  value={newGoal.currentAmount || ""}
                  onChange={(e) => setNewGoal({...newGoal, currentAmount: parseFloat(e.target.value)})}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              
              <div className="grid gap-2">
                <Label className="text-white">Target Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white flex justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newGoal.targetDate ? format(newGoal.targetDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-space-dark border-white/10">
                    <Calendar
                      mode="single"
                      selected={newGoal.targetDate}
                      onSelect={(date) => date && setNewGoal({...newGoal, targetDate: date})}
                      initialFocus
                      className="bg-space-dark text-white"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select 
                  value={newGoal.category} 
                  onValueChange={(value) => setNewGoal({...newGoal, category: value})}
                >
                  <SelectTrigger id="category" className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-space-dark border-white/10">
                    <SelectItem value="savings" className="text-white focus:bg-white/10 focus:text-white">Savings</SelectItem>
                    <SelectItem value="investment" className="text-white focus:bg-white/10 focus:text-white">Investment</SelectItem>
                    <SelectItem value="travel" className="text-white focus:bg-white/10 focus:text-white">Travel</SelectItem>
                    <SelectItem value="home" className="text-white focus:bg-white/10 focus:text-white">Home</SelectItem>
                    <SelectItem value="vehicle" className="text-white focus:bg-white/10 focus:text-white">Vehicle</SelectItem>
                    <SelectItem value="education" className="text-white focus:bg-white/10 focus:text-white">Education</SelectItem>
                    <SelectItem value="technology" className="text-white focus:bg-white/10 focus:text-white">Technology</SelectItem>
                    <SelectItem value="other" className="text-white focus:bg-white/10 focus:text-white">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority" className="text-white">Priority</Label>
                <Select 
                  value={newGoal.priority} 
                  onValueChange={(value) => setNewGoal({...newGoal, priority: value as 'low' | 'medium' | 'high'})}
                >
                  <SelectTrigger id="priority" className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-space-dark border-white/10">
                    <SelectItem value="low" className="text-white focus:bg-white/10 focus:text-white">Low</SelectItem>
                    <SelectItem value="medium" className="text-white focus:bg-white/10 focus:text-white">Medium</SelectItem>
                    <SelectItem value="high" className="text-white focus:bg-white/10 focus:text-white">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddGoal} 
                className="bg-space-purple hover:bg-space-pink text-white"
              >
                Create Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall Progress */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="glassmorphism text-white col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-space-purple" />
              Overall Progress
            </CardTitle>
            <CardDescription className="text-gray-400">All financial goals combined</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">${totalProgress.totalCurrent.toFixed(2)}</div>
                <div className="text-gray-400">of ${totalProgress.totalTarget.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-medium text-space-pink">
                  ${totalProgress.remaining.toFixed(2)} to go
                </div>
                <div className="text-gray-400 text-sm">{totalProgress.percentage.toFixed(1)}% complete</div>
              </div>
            </div>
            <Progress 
              value={totalProgress.percentage} 
              className="h-2 bg-white/10"
            />
          </CardContent>
        </Card>
        
        <Card className="glassmorphism text-white">
          <CardHeader className="pb-2">
            <CardTitle>Goal Distribution</CardTitle>
            <CardDescription className="text-gray-400">By target amount</CardDescription>
          </CardHeader>
          <CardContent className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={goalDistributionData()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                >
                  {goalDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `$${value}`}
                  contentStyle={{ backgroundColor: '#0B0B19', borderColor: '#9B87F5', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism text-white">
          <CardHeader className="pb-2">
            <CardTitle>Progress Summary</CardTitle>
            <CardDescription className="text-gray-400">Goals by status</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                <div className="text-xl font-bold">{goals.length}</div>
                <div className="text-gray-400 text-xs text-center">Total Goals</div>
              </div>
              <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                <div className="text-xl font-bold">
                  {goals.filter(goal => (goal.currentAmount / goal.targetAmount) >= 0.5).length}
                </div>
                <div className="text-gray-400 text-xs text-center">Half Way</div>
              </div>
              <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                <div className="text-xl font-bold">
                  {goals.filter(goal => goal.currentAmount >= goal.targetAmount).length}
                </div>
                <div className="text-gray-400 text-xs text-center">Completed</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Recent</span>
                <span>Upcoming</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                {goals.length > 0 && (
                  <div 
                    className="h-full bg-gradient-to-r from-space-pink to-space-purple" 
                    style={{ width: `${(goals.filter(goal => goal.currentAmount > 0).length / goals.length) * 100}%` }}
                  ></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glassmorphism text-white md:col-span-2">
          <CardHeader>
            <CardTitle>Your Financial Goals</CardTitle>
            <CardDescription className="text-gray-400">
              {goals.length} active goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="text-center py-10">
                <div className="mx-auto h-16 w-16 mb-4 bg-white/5 rounded-full flex items-center justify-center">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium">No goals yet</h3>
                <p className="text-gray-400 mt-2 mb-4">
                  Start by creating your first financial goal
                </p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)} 
                  className="bg-space-purple hover:bg-space-pink text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Goal
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const monthsLeft = differenceInMonths(goal.targetDate, new Date());
                  const isPastDue = monthsLeft < 0;
                  
                  return (
                    <div 
                      key={goal.id} 
                      className="p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-lg flex items-center">
                            {goal.name}
                            <Badge 
                              className={`ml-2 text-xs ${
                                goal.priority === 'high' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' :
                                goal.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' :
                                'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                              }`}
                            >
                              {goal.priority}
                            </Badge>
                          </h3>
                          <p className="text-gray-400 text-sm capitalize">{goal.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => {
                              setSelectedGoal(goal);
                              setIsAddFundsDialogOpen(true);
                            }}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                            onClick={() => {
                              setSelectedGoal(goal);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-white/10"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 mb-1 text-sm">
                        <div>${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}</div>
                        <div>{progress.toFixed(0)}%</div>
                      </div>
                      
                      <Progress 
                        value={progress} 
                        className="h-2 bg-white/10"
                        indicatorClassName={progress >= 100 ? "bg-green-500" : "bg-space-purple"}
                      />
                      
                      <div className="flex justify-between mt-3">
                        <div className={`text-xs ${isPastDue ? 'text-red-400' : 'text-gray-400'}`}>
                          {isPastDue 
                            ? `Past due by ${Math.abs(monthsLeft)} month${Math.abs(monthsLeft) === 1 ? '' : 's'}`
                            : monthsLeft === 0 
                              ? "Due this month"
                              : `${monthsLeft} month${monthsLeft === 1 ? '' : 's'} remaining`
                          }
                        </div>
                        <div className="text-xs text-gray-400">
                          Target: {format(goal.targetDate, "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Edit Goal Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="bg-space-dark border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Edit Financial Goal</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Update your goal details and targets.
                  </DialogDescription>
                </DialogHeader>
                {selectedGoal && (
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-goal-name" className="text-white">Goal Name</Label>
                      <Input 
                        id="edit-goal-name"
                        value={selectedGoal.name}
                        onChange={(e) => setSelectedGoal({...selectedGoal, name: e.target.value})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit-target-amount" className="text-white">Target Amount</Label>
                      <Input 
                        id="edit-target-amount"
                        type="number" 
                        value={selectedGoal.targetAmount}
                        onChange={(e) => setSelectedGoal({...selectedGoal, targetAmount: parseFloat(e.target.value)})}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label className="text-white">Target Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="bg-white/5 border-white/10 text-white flex justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(selectedGoal.targetDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-space-dark border-white/10">
                          <Calendar
                            mode="single"
                            selected={selectedGoal.targetDate}
                            onSelect={(date) => date && setSelectedGoal({...selectedGoal, targetDate: date})}
                            initialFocus
                            className="bg-space-dark text-white"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category" className="text-white">Category</Label>
                      <Select 
                        value={selectedGoal.category} 
                        onValueChange={(value) => setSelectedGoal({...selectedGoal, category: value})}
                      >
                        <SelectTrigger id="edit-category" className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-space-dark border-white/10">
                          <SelectItem value="savings" className="text-white focus:bg-white/10 focus:text-white">Savings</SelectItem>
                          <SelectItem value="investment" className="text-white focus:bg-white/10 focus:text-white">Investment</SelectItem>
                          <SelectItem value="travel" className="text-white focus:bg-white/10 focus:text-white">Travel</SelectItem>
                          <SelectItem value="home" className="text-white focus:bg-white/10 focus:text-white">Home</SelectItem>
                          <SelectItem value="vehicle" className="text-white focus:bg-white/10 focus:text-white">Vehicle</SelectItem>
                          <SelectItem value="education" className="text-white focus:bg-white/10 focus:text-white">Education</SelectItem>
                          <SelectItem value="technology" className="text-white focus:bg-white/10 focus:text-white">Technology</SelectItem>
                          <SelectItem value="other" className="text-white focus:bg-white/10 focus:text-white">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="edit-priority" className="text-white">Priority</Label>
                      <Select 
                        value={selectedGoal.priority} 
                        onValueChange={(value) => setSelectedGoal({...selectedGoal, priority: value as 'low' | 'medium' | 'high'})}
                      >
                        <SelectTrigger id="edit-priority" className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-space-dark border-white/10">
                          <SelectItem value="low" className="text-white focus:bg-white/10 focus:text-white">Low</SelectItem>
                          <SelectItem value="medium" className="text-white focus:bg-white/10 focus:text-white">Medium</SelectItem>
                          <SelectItem value="high" className="text-white focus:bg-white/10 focus:text-white">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button 
                    onClick={handleEditGoal} 
                    className="bg-space-purple hover:bg-space-pink text-white"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Add Funds Dialog */}
            <Dialog open={isAddFundsDialogOpen} onOpenChange={setIsAddFundsDialogOpen}>
              <DialogContent className="bg-space-dark border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Add Funds to Goal</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {selectedGoal && `Update progress for "${selectedGoal.name}"`}
                  </DialogDescription>
                </DialogHeader>
                {selectedGoal && (
                  <div className="grid gap-4 py-4">
                    <div className="flex justify-between text-sm">
                      <span>Current amount:</span>
                      <span>${selectedGoal.currentAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Target amount:</span>
                      <span>${selectedGoal.targetAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining:</span>
                      <span>${(selectedGoal.targetAmount - selectedGoal.currentAmount).toFixed(2)}</span>
                    </div>
                    <div className="py-2">
                      <Progress 
                        value={(selectedGoal.currentAmount / selectedGoal.targetAmount) * 100} 
                        className="h-2 bg-white/10"
                      />
                    </div>
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="add-funds" className="text-white">Amount to Add</Label>
                      <Input 
                        id="add-funds"
                        type="number" 
                        placeholder="0.00" 
                        step="0.01"
                        value={additionalFunds}
                        onChange={(e) => setAdditionalFunds(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button 
                    onClick={handleAddFunds} 
                    className="bg-space-purple hover:bg-space-pink text-white"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Add Funds
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="glassmorphism text-white">
          <CardHeader>
            <CardTitle>Progress by Category</CardTitle>
            <CardDescription className="text-gray-400">Target vs. current amounts</CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={progressByCategory()}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#6E59A5" opacity={0.2} />
                <XAxis type="number" stroke="#D6BCFA" fontSize={10} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#D6BCFA" 
                  fontSize={10}
                  tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0B19', borderColor: '#9B87F5' }}
                  formatter={(value) => [`$${value}`, '']}
                />
                <Legend />
                <Bar dataKey="Target" name="Target" fill="#9B87F5" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Progress" name="Current" fill="#D946EF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default GoalsDashboard;
