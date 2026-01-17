import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn, Loader2, AlertCircle, Shield, Lock, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

// Input validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100, 'Username too long'),
  password: z.string().min(1, 'Password is required').max(128, 'Password too long'),
});

// Floating particle component
const FloatingParticle = ({ delay, duration, size, left, top }: { delay: number; duration: number; size: number; left: string; top: string }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20 blur-sm"
    style={{ width: size, height: size, left, top }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.6, 0],
      scale: [0, 1, 0.5],
      y: [-20, -100],
      x: [0, Math.random() * 40 - 20],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeOut',
    }}
  />
);

// Animated grid background
const AnimatedGrid = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
    <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary/30" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  </div>
);

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { login, mfaRequired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/';

  const validateInputs = () => {
    try {
      loginSchema.parse({ username, password });
      setValidationErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            errors[e.path[0] as string] = e.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(username, password);

      if (response.mfa_required) {
        setError('MFA verification required. Please contact administrator.');
        return;
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
    size: 4 + Math.random() * 8,
    left: `${Math.random() * 100}%`,
    top: `${60 + Math.random() * 40}%`,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedGrid />
      
      {/* Floating Particles */}
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} {...particle} />
      ))}

      {/* Glowing orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        style={{ top: '-10%', right: '-10%' }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-primary/15 blur-3xl"
        style={{ bottom: '-5%', left: '-5%' }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Glass Card */}
        <div className="relative">
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50 rounded-2xl blur-lg opacity-40" />
          
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Top decorative bar */}
            <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            {/* Header */}
            <div className="pt-10 pb-6 px-8 text-center relative">
              {/* Animated Logo/Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="relative mx-auto mb-6"
              >
                <div className="w-20 h-20 mx-auto relative">
                  {/* Outer ring */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  />
                  {/* Inner glow */}
                  <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm" />
                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-primary" />
                  </div>
                 
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent"
              >
                USMAN HARDWARES
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-2 text-muted-foreground"
              >
                Sign in to access your account
              </motion.p>
            </div>

            {/* Form */}
            <div className="px-8 pb-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Alert */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        </div>
                        <p className="text-sm text-destructive pt-1">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Username Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="username" className="text-sm font-medium text-foreground/80">
                    Username
                  </Label>
                  <div className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-xl blur opacity-0 transition-opacity duration-300 ${focusedField === 'username' ? 'opacity-100' : 'group-hover:opacity-50'}`} />
                    <div className="relative">
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, username: '' }));
                        }}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                        disabled={isLoading}
                        autoComplete="username"
                        autoFocus
                        className="h-12 bg-background/50 border-border/50 rounded-xl pl-4 pr-4 transition-all duration-300 focus:bg-background focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <AnimatePresence>
                    {validationErrors.username && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-sm text-destructive"
                      >
                        {validationErrors.username}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                    Password
                  </Label>
                  <div className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-xl blur opacity-0 transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-100' : 'group-hover:opacity-50'}`} />
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setValidationErrors((prev) => ({ ...prev, password: '' }));
                        }}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        disabled={isLoading}
                        autoComplete="current-password"
                        className="h-12 bg-background/50 border-border/50 rounded-xl pl-11 pr-12 transition-all duration-300 focus:bg-background focus:border-primary/50"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {validationErrors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-sm text-destructive"
                      >
                        {validationErrors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="pt-2"
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Signing in...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2"
                      >
                        <LogIn className="h-5 w-5" />
                        <span>Sign In</span>
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* MFA Notice */}
              <AnimatePresence>
                {mfaRequired && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
                  >
                    <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                      Multi-factor authentication is required.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom decorative elements */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
        </div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-sm text-muted-foreground/60"
        >
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;