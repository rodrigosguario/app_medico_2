import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUserHospitals } from '@/hooks/useUserHospitals';
import { Plus, Edit, Trash2, Building2, MapPin, Phone, Mail } from 'lucide-react';

const HospitalManager: React.FC = () => {
  const { hospitals, loading, createHospital, updateHospital, deleteHospital } = useUserHospitals();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHospital(formData);
      setFormData({ name: '', address: '', phone: '', email: '' });
      setIsCreateOpen(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHospital) return;
    
    try {
      await updateHospital(editingHospital.id, formData);
      setEditingHospital(null);
      setFormData({ name: '', address: '', phone: '', email: '' });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este hospital?')) {
      try {
        console.log('🗑️ Removendo hospital:', id);
        await deleteHospital(id);
      } catch (error) {
        console.error('❌ Erro ao remover hospital:', error);
      }
    }
  };

  const openEditDialog = (hospital: any) => {
    setEditingHospital(hospital);
    setFormData({
      name: hospital.name || '',
      address: hospital.address || '',
      phone: hospital.phone || '',
      email: hospital.email || ''
    });
  };

  if (loading) {
    return <div className="flex justify-center py-8">Carregando hospitais...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Meus Hospitais e Locais de Trabalho
            </CardTitle>
            <CardDescription>
              Gerencie seus locais de trabalho para organizar melhor seus plantões
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Hospital
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Hospital</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Hospital *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Hospital das Clínicas"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua das Flores, 123 - Centro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@hospital.com"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Criar Hospital
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {hospitals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum hospital cadastrado ainda</p>
            <p className="text-sm">Adicione seus locais de trabalho para organizar melhor seus plantões</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {hospitals.map((hospital) => (
              <div key={hospital.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {hospital.name}
                    </h3>
                    {hospital.address && (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {hospital.address}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {hospital.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {hospital.phone}
                        </span>
                      )}
                      {hospital.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {hospital.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(hospital)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(hospital.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingHospital} onOpenChange={() => setEditingHospital(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Hospital</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Hospital *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Hospital das Clínicas"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Endereço</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua das Flores, 123 - Centro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@hospital.com"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingHospital(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default HospitalManager;