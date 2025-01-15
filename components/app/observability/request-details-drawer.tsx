"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RequestDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    event_id: string;
    session_id: string;
    event_type: string;
    method: string;
    url: string;
    status: number;
    timestamp: string;
    payload: string;
    body: string;
    headers: string;
  };
}

export function RequestDetailsDrawer({
  isOpen,
  onClose,
  event,
}: RequestDetailsDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Request Details</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Method
                </p>
                <p className="text-sm">{event.method}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    event.status >= 400
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {event.status}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">URL</p>
                <p className="text-sm break-all">{event.url}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Session ID
                </p>
                <p className="text-sm font-mono">{event.session_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Timestamp
                </p>
                <p className="text-sm">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="request" className="mt-6">
            <TabsList>
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
            </TabsList>
            <TabsContent value="request">
              <Card>
                <CardHeader>
                  <CardTitle>Request Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.headers && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Headers</h4>
                        <ScrollArea className=" h-[200px] w-full rounded-md border p-4 ">
                          {JSON.stringify(JSON.parse(event.headers), null, 2)}
                        </ScrollArea>
                      </div>
                    )}
                    {event.payload && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Request Data
                        </h4>
                        <ScrollArea className=" h-[200px] max-w-[200px] w-full rounded-md border p-4 ">
                          {JSON.stringify(JSON.parse(event.payload), null, 2)}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="response">
              <Card>
                <CardHeader>
                  <CardTitle>Response Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.body && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Response Data
                        </h4>
                        <ScrollArea className=" h-[200px] w-full rounded-md border p-4 ">
                          {JSON.stringify(JSON.parse(event.body), null, 2)}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
