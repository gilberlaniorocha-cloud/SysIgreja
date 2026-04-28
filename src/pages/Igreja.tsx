import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { getIgreja, updateIgreja } from '../lib/queries';
import { Database } from '../types/database';
import { Save } from 'lucide-react';

type Igreja = Database['public']['Tables']['igrejas']['Row'];

export default function Igreja() {
  const { igrejaId } = useAuth();
  const [igreja, setIgreja] = useState<Igreja | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cidade: '',
    bairro: '',
    estado: '',
    cep: '',
    cnpj: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!igrejaId) return;
      try {
        const data = await getIgreja(igrejaId);
        setIgreja(data);
        if (data) {
          setFormData({
            nome: data.nome || '',
            endereco: data.endereco || '',
            cidade: data.cidade || '',
            bairro: data.bairro || '',
            estado: data.estado || '',
            cep: data.cep || '',
            cnpj: data.cnpj || ''
          });
        }
      } catch (error) {
        console.error('Error loading igreja:', error);
        setError('Erro ao carregar os dados da igreja.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [igrejaId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!igrejaId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateIgreja(igrejaId, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating igreja:', error);
      setError('Erro ao salvar os dados da igreja.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Carregando dados da igreja...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cadastro da Igreja</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">Dados salvos com sucesso!</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-100 px-4 py-5 sm:rounded-2xl sm:p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome da Igreja *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="nome"
                  id="nome"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl p-2.5 border transition-shadow"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1.5">
                CNPJ
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="cnpj"
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl p-2.5 border transition-shadow"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-1.5">
                CEP
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="cep"
                  id="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  placeholder="00000-000"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl p-2.5 border transition-shadow"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1.5">
                Endereço
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="endereco"
                  id="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl p-2.5 border transition-shadow"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-1.5">
                Bairro
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="bairro"
                  id="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl p-2.5 border transition-shadow"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-1.5">
                Cidade
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="cidade"
                  id="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl p-2.5 border transition-shadow"
                />
              </div>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1.5">
                UF
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="estado"
                  id="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  maxLength={2}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl p-2.5 border uppercase transition-shadow"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              <Save className="-ml-1 mr-2 h-5 w-5" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
