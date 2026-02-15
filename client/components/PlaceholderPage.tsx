import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  description: string;
  actionText?: string;
  actionRoute?: string;
}

export default function PlaceholderPage({ 
  title, 
  description, 
  actionText = "العودة للصفحة الرئيسية",
  actionRoute = "/"
}: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Construction className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-center">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => navigate(actionRoute)} className="w-full">
            <ArrowRight className="w-4 h-4 ml-2" />
            {actionText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
