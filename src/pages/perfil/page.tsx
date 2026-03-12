import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import MainLayout from '../../components/layout/MainLayout';
import { toast } from 'react-hot-toast';

export default function PerfilPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    avatar_url: ''
  });

  const [senhaData, setSenhaData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        nome: userProfile.nome || userProfile.name || '',
        telefone: userProfile.phone || '',
        avatar_url: userProfile.avatar_url || ''
      });
    }
  }, [userProfile]);

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return numbers.substring(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'telefone') {
      setFormData(prev => ({ ...prev, [name]: formatTelefone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSenhaData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use apenas imagens (JPG, PNG, GIF, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
      if (formData.avatar_url) {
        const oldFileName = formData.avatar_url.split('/').pop();
        if (oldFileName) await supabase.storage.from('avatars').remove([oldFileName]);
      }
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast.success('Foto enviada! Clique em "Salvar Alterações" para confirmar.');
    } catch (error: any) {
      toast.error('Erro ao enviar foto: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    toast.success('Foto removida! Clique em "Salvar Alterações" para confirmar.');
  };

  const handleSalvarPerfil = async () => {
    if (!user) return;

    const nomeLimpo = formData.nome.trim();
    if (!nomeLimpo) {
      toast.error('O nome não pode estar vazio.');
      return;
    }

    // Valida telefone: deve ter pelo menos 10 dígitos se preenchido
    const telefoneSoNumeros = formData.telefone.replace(/\D/g, '');
    if (telefoneSoNumeros && telefoneSoNumeros.length < 10) {
      toast.error('Telefone inválido. Digite um número com DDD (ex: 11 99999-9999).');
      return;
    }
    const telefoneLimpo = telefoneSoNumeros || null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          nome: nomeLimpo,
          name: nomeLimpo,
          phone: telefoneLimpo,
          avatar_url: formData.avatar_url || null,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Atualiza o formulário local imediatamente
      if (data) {
        setFormData(prev => ({
          ...prev,
          nome: data.nome || data.name || prev.nome,
          telefone: data.phone ? formatTelefone(data.phone) : prev.telefone,
          avatar_url: data.avatar_url || prev.avatar_url,
        }));
      }

      // Força re-fetch do perfil no contexto global
      await refreshProfile();

      // Aguarda o estado propagar antes de navegar
      await new Promise(resolve => setTimeout(resolve, 300));

      toast.success('Perfil atualizado com sucesso!');
      navigate('/', { replace: true });
    } catch (error: any) {
      toast.error('Erro ao salvar perfil: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarSenha = async () => {
    // Permite definir/alterar senha mesmo para usuários que se registraram via OAuth.
    if (!senhaData.novaSenha) {
      toast.error('Digite a nova senha.');
      return;
    }
    if (senhaData.novaSenha !== senhaData.confirmarSenha) {
      toast.error('A nova senha e a confirmação não coincidem.');
      return;
    }
    if (senhaData.novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      // Supabase permite atualizar a senha quando o usuário está autenticado.
      const { error } = await supabase.auth.updateUser({ password: senhaData.novaSenha });
      if (error) {
        // Se houver erro de autenticação, sugerir usar 'Esqueci a senha'.
        if ((error.message || '').toString().toLowerCase().includes('invalid')) {
          toast.error('Não foi possível alterar a senha. Use "Esqueci a senha" para criar uma senha por e-mail.');
        } else {
          toast.error('Erro ao alterar senha: ' + (error.message || 'Erro desconhecido'));
        }
        return;
      }
      setSenhaData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      toast.success('Senha alterada com sucesso! Agora você pode usar e-mail e senha para entrar.');
    } catch (error: any) {
      toast.error('Erro ao alterar senha: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarLinkSenha = async () => {
    if (!user?.email) {
      toast.error('E-mail não disponível para envio.');
      return;
    }
    setLoading(true);
    try {
      const resetLink = `${window.location.origin}/login`;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: resetLink });
      if (error) throw error;
      toast.success('Link para criação de senha enviado ao seu e-mail. Verifique a caixa de entrada.');
    } catch (err: any) {
      toast.error('Erro ao enviar link: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const displayName = (() => {
    // Prioriza o que está no formulário (já editado), depois o perfil salvo
    const fromForm = formData.nome?.trim();
    const fromProfile = userProfile?.nome || userProfile?.name || '';
    const full = fromForm || fromProfile;
    if (full) return full.split(/\s+/)[0];
    return user?.email?.split('@')[0] || 'Usuário';
  })();

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">

          {/* Header */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative flex-shrink-0">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar"
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-emerald-400/20" />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-700 rounded-full flex items-center justify-center border-4 border-emerald-400/20">
                    <i className="ri-user-line text-2xl text-gray-400"></i>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                  {displayName}
                </h1>
                <p className="text-sm text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6 mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-user-line text-emerald-400"></i>
              </div>
              Dados Pessoais
            </h3>

            {/* Foto */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Foto do Perfil</label>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-4 border-emerald-400/20" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center border-4 border-emerald-400/20">
                      <i className="ri-user-line text-2xl text-gray-400"></i>
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg cursor-pointer text-sm font-medium transition-colors whitespace-nowrap">
                    {uploadingAvatar ? 'Enviando...' : 'Trocar foto'}
                    <input type="file" accept="image/*"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }}
                      className="hidden" disabled={uploadingAvatar} />
                  </label>
                  {formData.avatar_url && (
                    <button type="button" onClick={handleRemoveAvatar}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors cursor-pointer whitespace-nowrap"
                      disabled={uploadingAvatar}>
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleEnviarLinkSenha}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-sm text-[#9CA3AF]"
              >
                <i className="ri-mail-line"></i>
                Enviar link para criar/recuperar senha
              </button>
            </div>

            {/* Campos */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input type="email" value={user?.email || ''} disabled
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
                <input type="text" name="nome" value={formData.nome} onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
                <input type="text" name="telefone" value={formData.telefone} onChange={handleInputChange}
                  placeholder="(00) 00000-0000" maxLength={15}
                  className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm" />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={handleSalvarPerfil} disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer text-sm">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Salvando...</>
                ) : (
                  <><div className="w-4 h-4 flex items-center justify-center"><i className="ri-save-line"></i></div>Salvar Alterações</>
                )}
              </button>
            </div>
          </div>

          {/* Alterar Senha */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-lock-line text-yellow-400"></i>
              </div>
              Alterar Senha
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Senha Atual</label>
                <input type="password" name="senhaAtual" value={senhaData.senhaAtual} onChange={handleSenhaChange}
                  placeholder="Digite sua senha atual"
                  className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nova Senha</label>
                <input type="password" name="novaSenha" value={senhaData.novaSenha} onChange={handleSenhaChange}
                  placeholder="Digite a nova senha"
                  className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Nova Senha</label>
                <input type="password" name="confirmarSenha" value={senhaData.confirmarSenha} onChange={handleSenhaChange}
                  placeholder="Confirme a nova senha"
                  className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm" />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={handleAlterarSenha} disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer text-sm">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Alterando...</>
                ) : (
                  <><div className="w-4 h-4 flex items-center justify-center"><i className="ri-key-line"></i></div>Alterar Senha</>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
