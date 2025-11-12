import React, { useState, FormEvent, useEffect } from 'react';
import { BotIcon, LoadingSpinner, XIcon } from './Icons';
import { useLocale } from '../contexts/LocaleContext';

interface AuthProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (name: string, email: string, password: string) => Promise<void>;
    error: string | null;
    isLoading: boolean;
    onClose?: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, error, isLoading, onClose }) => {
    const [isRegisterView, setIsRegisterView] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { t } = useLocale();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            onClose?.();
          }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
          document.removeEventListener('keydown', handleKeyDown);
        };
      }, [onClose]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        if (isRegisterView) {
            onRegister(name, email, password);
        } else {
            onLogin(email, password);
        }
    };

    const toggleView = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsRegisterView(!isRegisterView);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-base-100 dark:bg-dark-base-100 px-4 py-12 md:min-h-0">
            <div className="w-full max-w-md space-y-8 animate-fade-in relative">
                 {onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute -top-4 -right-4 md:-top-10 md:-right-10 p-2 rounded-full bg-base-200/50 dark:bg-dark-base-200/50 hover:bg-base-300 dark:hover:bg-dark-base-200 text-text-secondary dark:text-dark-text-secondary"
                        aria-label={t('close')}
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                )}
                <div className="text-center">
                    <BotIcon className="mx-auto h-12 w-auto text-brand-primary" />
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
                        {isRegisterView ? t('register') : t('login')}
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                        {isRegisterView ? t('alreadyHaveAccount') : t('dontHaveAccount')}{' '}
                        <button onClick={toggleView} className="font-medium text-brand-primary hover:text-brand-secondary">
                            {isRegisterView ? t('login') : t('register')}
                        </button>
                    </p>
                </div>
                <div className="bg-base-100 dark:bg-dark-base-300 p-8 shadow-xl rounded-2xl border border-base-200 dark:border-dark-base-200">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {isRegisterView && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                                    {t('name')}
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full p-3 bg-base-200/50 dark:bg-dark-base-200/30 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                                {t('emailAddress')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 bg-base-200/50 dark:bg-dark-base-200/30 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                                {t('password')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={isRegisterView ? 'new-password' : 'current-password'}
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 bg-base-200/50 dark:bg-dark-base-200/30 border border-base-300 dark:border-dark-base-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none text-sm"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-primary hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 active:scale-95 transition-transform"
                            >
                                {isLoading ? <LoadingSpinner className="w-5 h-5"/> : (isRegisterView ? t('registerButton') : t('loginButton'))}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};