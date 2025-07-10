import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, User, KeyRound, Shield, Loader2, Mail } from 'lucide-react';
import { apiClient } from '@/lib/api';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getStaff();
      setStaff(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch staff members.", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'cashier' });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    try {
      await apiClient.signUp(formData.email, formData.password, formData.name, formData.role);
      toast({ title: "Success", description: `${formData.name} has been added.` });
      fetchStaff();
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({ title: "Failed to add staff", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (userId, name) => {
    if (window.confirm(`Are you sure you want to remove ${name}? This action is irreversible.`)) {
      try {
        await apiClient.deleteStaff(userId);
        toast({ title: "Success", description: `${name} has been deleted.` });
        fetchStaff();
      } catch (error) {
        toast({ title: "Failed to delete staff", description: error.message, variant: "destructive" });
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-amber-100">Staff Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-effect border-amber-800/50">
            <DialogHeader>
              <DialogTitle className="text-amber-100">Add New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label className="text-amber-200">Full Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-black/20 border-amber-800/50 text-amber-100" required />
              </div>
              <div>
                <Label className="text-amber-200">Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-black/20 border-amber-800/50 text-amber-100" required />
              </div>
              <div>
                <Label className="text-amber-200">Password (min. 6 chars) *</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="bg-black/20 border-amber-800/50 text-amber-100" required />
              </div>
              <div>
                <Label className="text-amber-200">Role</Label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full h-10 px-3 rounded-md bg-black/20 border border-amber-800/50 text-amber-100">
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Add Staff Member</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member, index) => (
          <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="glass-effect border-amber-800/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-amber-950/50 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-amber-400"/>
                     </div>
                     <div>
                        <h3 className="font-semibold text-amber-100">{member.name}</h3>
                        <p className="text-sm text-amber-200/80 flex items-center capitalize">
                            {member.role === 'admin' ? <Shield className="w-3 h-3 mr-1 text-green-400"/> : <User className="w-3 h-3 mr-1"/>}
                            {member.role}
                        </p>
                     </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(member.id, member.name)} className="h-8 w-8 p-0 hover:bg-red-950/50">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-200/70 bg-black/20 p-2 rounded-md">
                    <Mail className="w-4 h-4 text-amber-500" />
                    <span>{member.email}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default StaffManagement;