"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, RefreshCcw, Copy, Check, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const withdrawalsQuery = query(
      collection(db, "withdrawals"),
      orderBy("createdAtISO", "desc")
    );

    const unsubscribe = onSnapshot(withdrawalsQuery, (snapshot) => {
      const withdrawalsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWithdrawals(withdrawalsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredWithdrawals = withdrawals.filter(
    (withdrawal) =>
      withdrawal.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.walletAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyAddress = async (address, withdrawalId) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(withdrawalId);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedWithdrawal || !newStatus) return;

    try {
      const withdrawalRef = doc(db, "withdrawals", selectedWithdrawal.id);
      await updateDoc(withdrawalRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Withdrawal status updated successfully",
      });

      setSelectedWithdrawal(null);
      setNewStatus("");
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      toast({
        title: "Error",
        description: "Failed to update withdrawal status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "default",
      processing: "secondary",
      completed: "default",
      rejected: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Withdrawal Requests</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search withdrawals..."
              className="pl-8 w-full sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLoading(true)}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">Loading withdrawals...</p>
        </div>
      ) : filteredWithdrawals.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Withdrawals Found</CardTitle>
            <CardDescription>
              {searchQuery
                ? "No withdrawals match your search criteria."
                : "No withdrawal requests have been submitted yet."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Coin</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell className="font-medium">
                    {withdrawal.userName || "Unknown User"}
                  </TableCell>
                  <TableCell>{withdrawal.userEmail || "N/A"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{withdrawal.coin}</p>
                      <p className="text-xs text-muted-foreground">
                        {withdrawal.network}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${parseFloat(withdrawal.amount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-xs">
                      <code className="text-xs break-all font-mono flex-1">
                        {withdrawal.walletAddress}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          handleCopyAddress(
                            withdrawal.walletAddress,
                            withdrawal.id
                          )
                        }
                        className="shrink-0"
                      >
                        {copiedAddress === withdrawal.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(withdrawal.createdAtISO)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedWithdrawal(withdrawal);
                        setNewStatus(withdrawal.status);
                      }}
                    >
                      Update Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && filteredWithdrawals.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredWithdrawals.length} of {withdrawals.length}{" "}
          withdrawal{withdrawals.length !== 1 ? "s" : ""}
        </div>
      )}

      <Dialog
        open={!!selectedWithdrawal}
        onOpenChange={() => {
          setSelectedWithdrawal(null);
          setNewStatus("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Withdrawal Status</DialogTitle>
            <DialogDescription>
              Update the status of this withdrawal request
            </DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">User:</p>
                <p className="text-sm">{selectedWithdrawal.userName}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Amount:</p>
                <p className="text-sm font-semibold">
                  ${parseFloat(selectedWithdrawal.amount).toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Coin:</p>
                <p className="text-sm">{selectedWithdrawal.coin}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Wallet Address:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs break-all font-mono flex-1 p-2 bg-muted rounded">
                    {selectedWithdrawal.walletAddress}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      handleCopyAddress(
                        selectedWithdrawal.walletAddress,
                        selectedWithdrawal.id
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedWithdrawal(null);
                setNewStatus("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

